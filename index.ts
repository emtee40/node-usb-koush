import events, { EventEmitter } from "events";

import {
	CapabilityDescriptor,
	LibUSBException,
	Device,
	Endpoint as EndpointType,
	OutEndpoint as OutEndpointType,
	InEndpoint as InEndpointType,
	EndpointDescriptor, Transfer,
	Interface as InterfaceType,
	InterfaceDescriptor
} from "./types";

const usb = require("bindings")("usb_bindings")

export { Constants } from "./constants";
export default usb;
export * from "./types";

/**
 * Return a list of `Device` objects for the USB devices attached to the system.
 */
export function getDeviceList(): Device[] {
	return usb.getDeviceList();
}


function isBuffer(obj: any) {
	return obj && obj instanceof Uint8Array
}

if (usb.INIT_ERROR) {
	console.warn("Failed to initialize libusb.")
	usb.Device = function () { throw new Error("Device cannot be instantiated directly.") };
	usb.Transfer = function () { throw new Error("Transfer cannot be instantiated directly.") };
	usb.setDebugLevel = function () { };
	usb.getDeviceList = function () { return []; };
	usb._enableHotplugEvents = function () { };
	usb._disableHotplugEvents = function () { };
}

Object.keys(events.EventEmitter.prototype).forEach(function (key) {
	usb[key] = events.EventEmitter.prototype[key];
});

// convenience method for finding a device by vendor and product id
export function findByIds(vid, pid) {
	var devices = usb.getDeviceList()

	for (var i = 0; i < devices.length; i++) {
		var deviceDesc = devices[i].deviceDescriptor
		if ((deviceDesc.idVendor == vid) && (deviceDesc.idProduct == pid)) {
			return devices[i]
		}
	}
}

usb.Device.prototype.timeout = 1000

usb.Device.prototype.open = function (defaultConfig) {
	this.__open()
	if (defaultConfig === false) return
	this.interfaces = []
	var len = this.configDescriptor ? this.configDescriptor.interfaces.length : 0
	for (var i = 0; i < len; i++) {
		this.interfaces[i] = new Interface(this, i)
	}
}

usb.Device.prototype.close = function () {
	this.__close()
	this.interfaces = null
}

Object.defineProperty(usb.Device.prototype, "configDescriptor", {
	get: function () {
		try {
			return this._configDescriptor || (this._configDescriptor = this.__getConfigDescriptor())
		} catch (e) {
			// Check descriptor exists
			if (e.errno == usb.LIBUSB_ERROR_NOT_FOUND) return null;
			throw e;
		}
	}
});

Object.defineProperty(usb.Device.prototype, "allConfigDescriptors", {
	get: function () {
		try {
			return this._allConfigDescriptors || (this._allConfigDescriptors = this.__getAllConfigDescriptors())
		} catch (e) {
			// Check descriptors exist
			if (e.errno == usb.LIBUSB_ERROR_NOT_FOUND) return [];
			throw e;
		}
	}
});

Object.defineProperty(usb.Device.prototype, "parent", {
	get: function () {
		return this._parent || (this._parent = this.__getParent())
	}
});

usb.Device.prototype.interface = function (addr) {
	if (!this.interfaces) {
		throw new Error("Device must be open before searching for interfaces")
	}
	addr = addr || 0
	for (var i = 0; i < this.interfaces.length; i++) {
		if (this.interfaces[i].interfaceNumber == addr) {
			return this.interfaces[i]
		}
	}
}

var SETUP_SIZE = usb.LIBUSB_CONTROL_SETUP_SIZE

usb.Device.prototype.controlTransfer =
	function (bmRequestType, bRequest, wValue, wIndex, data_or_length, callback) {
		var self = this
		var isIn = !!(bmRequestType & usb.LIBUSB_ENDPOINT_IN)
		var wLength

		if (isIn) {
			if (!(data_or_length >= 0)) {
				throw new TypeError("Expected size number for IN transfer (based on bmRequestType)")
			}
			wLength = data_or_length
		} else {
			if (!isBuffer(data_or_length)) {
				throw new TypeError("Expected buffer for OUT transfer (based on bmRequestType)")
			}
			wLength = data_or_length.length
		}

		// Buffer for the setup packet
		// http://libusbx.sourceforge.net/api-1.0/structlibusb__control__setup.html
		var buf = Buffer.alloc(wLength + SETUP_SIZE)
		buf.writeUInt8(bmRequestType, 0)
		buf.writeUInt8(bRequest, 1)
		buf.writeUInt16LE(wValue, 2)
		buf.writeUInt16LE(wIndex, 4)
		buf.writeUInt16LE(wLength, 6)

		if (!isIn) {
			buf.set(data_or_length, SETUP_SIZE)
		}

		var transfer = new usb.Transfer(this, 0, usb.LIBUSB_TRANSFER_TYPE_CONTROL, this.timeout,
			function (error, buf, actual) {
				if (callback) {
					if (isIn) {
						callback.call(self, error, buf.slice(SETUP_SIZE, SETUP_SIZE + actual))
					} else {
						callback.call(self, error)
					}
				}
			}
		)

		try {
			transfer.submit(buf)
		} catch (e) {
			if (callback) {
				process.nextTick(function () { callback.call(self, e); });
			}
		}
		return this;
	}

usb.Device.prototype.getStringDescriptor = function (desc_index, callback) {
	var langid = 0x0409;
	var length = 255;
	this.controlTransfer(
		usb.LIBUSB_ENDPOINT_IN,
		usb.LIBUSB_REQUEST_GET_DESCRIPTOR,
		((usb.LIBUSB_DT_STRING << 8) | desc_index),
		langid,
		length,
		function (error, buf) {
			if (error) return callback(error);
			callback(undefined, buf.toString('utf16le', 2));
		}
	);
}

usb.Device.prototype.getBosDescriptor = function (callback) {

	if (this._bosDescriptor) {
		// Cached descriptor
		return callback(undefined, this._bosDescriptor);
	}

	if (this.deviceDescriptor.bcdUSB < 0x201) {
		// BOS is only supported from USB 2.0.1
		return callback(undefined, null);
	}

	this.controlTransfer(
		usb.LIBUSB_ENDPOINT_IN,
		usb.LIBUSB_REQUEST_GET_DESCRIPTOR,
		(usb.LIBUSB_DT_BOS << 8),
		0,
		usb.LIBUSB_DT_BOS_SIZE,
		function (error, buffer) {
			if (error) {
				// Check BOS descriptor exists
				if (error.errno == usb.LIBUSB_TRANSFER_STALL) return callback(undefined, null);
				return callback(error, null);
			}

			var totalLength = buffer.readUInt16LE(2);
			this.controlTransfer(
				usb.LIBUSB_ENDPOINT_IN,
				usb.LIBUSB_REQUEST_GET_DESCRIPTOR,
				(usb.LIBUSB_DT_BOS << 8),
				0,
				totalLength,
				function (error, buffer) {
					if (error) {
						// Check BOS descriptor exists
						if (error.errno == usb.LIBUSB_TRANSFER_STALL) return callback(undefined, null);
						return callback(error, null);
					}

					var descriptor = {
						bLength: buffer.readUInt8(0),
						bDescriptorType: buffer.readUInt8(1),
						wTotalLength: buffer.readUInt16LE(2),
						bNumDeviceCaps: buffer.readUInt8(4),
						capabilities: []
					};

					var i = usb.LIBUSB_DT_BOS_SIZE;
					while (i < descriptor.wTotalLength) {
						const bLength = buffer.readUInt8(i + 0);
						var capability = {
							bLength,
							bDescriptorType: buffer.readUInt8(i + 1),
							bDevCapabilityType: buffer.readUInt8(i + 2),
							dev_capability_data: buffer.slice(i + 3, i + bLength)
						};

						descriptor.capabilities.push(capability);
						i += capability.bLength;
					}

					// Cache descriptor
					this._bosDescriptor = descriptor;
					callback(undefined, this._bosDescriptor);
				}
			);
		}
	);
}

usb.Device.prototype.getCapabilities = function (callback) {
	var capabilities = [];
	var self = this;

	this.getBosDescriptor(function (error, descriptor) {
		if (error) return callback(error, null);

		var len = descriptor ? descriptor.capabilities.length : 0
		for (var i = 0; i < len; i++) {
			capabilities.push(new Capability(self, i))
		}

		callback(undefined, capabilities);
	});
}

usb.Device.prototype.setConfiguration = function (desired, cb) {
	var self = this;
	this.__setConfiguration(desired, function (err) {
		if (!err) {
			this.interfaces = []
			var len = this.configDescriptor ? this.configDescriptor.interfaces.length : 0
			for (var i = 0; i < len; i++) {
				this.interfaces[i] = new Interface(this, i)
			}
		}
		cb.call(self, err)
	});
}

class Interface implements InterfaceType {
	device: Device;
	id: number;
	altSetting = 0;
	descriptor: InterfaceDescriptor;
	interfaceNumber: number;
	endpoints: Endpoint[];

	constructor(device, id) {
		this.device = device
		this.id = id
		this.__refresh()
	}

	__refresh() {
		this.descriptor = this.device.configDescriptor.interfaces[this.id][this.altSetting]
		this.interfaceNumber = this.descriptor.bInterfaceNumber
		this.endpoints = []
		var len = this.descriptor.endpoints.length
		for (var i = 0; i < len; i++) {
			var desc = this.descriptor.endpoints[i]
			var c = (desc.bEndpointAddress & usb.LIBUSB_ENDPOINT_IN) ? InEndpoint : OutEndpoint
			this.endpoints[i] = new c(this.device, desc)
		}
	}

	claim() {
		this.device.__claimInterface(this.id)
	}

	release(closeEndpoints, cb?) {
		var self = this;
		if (typeof closeEndpoints == 'function') {
			cb = closeEndpoints;
			closeEndpoints = null;
		}

		if (!closeEndpoints || this.endpoints.length == 0) {
			next();
		} else {
			var n = self.endpoints.length;
			self.endpoints.forEach(function (ep, _i) {
				if (ep.pollActive) {
					ep.once('end', function () {
						if (--n == 0) next();
					});
					ep.stopPoll();
				} else {
					if (--n == 0) next();
				}
			});
		}

		function next() {
			(self.device as any).__releaseInterface(self.id, function (err) {
				if (!err) {
					self.altSetting = 0;
					self.__refresh()
				}
				cb.call(self, err)
			})
		}
	}

	isKernelDriverActive() {
		return this.device.__isKernelDriverActive(this.id)
	}

	detachKernelDriver() {
		return this.device.__detachKernelDriver(this.id)
	};

	attachKernelDriver() {
		return this.device.__attachKernelDriver(this.id)
	};


	setAltSetting(altSetting, cb) {
		var self = this;
		(this.device as any).__setInterface(this.id, altSetting, function (err) {
			if (!err) {
				self.altSetting = altSetting;
				self.__refresh();
			}
			cb.call(self, err)
		})
	}

	endpoint = function (addr) {
		for (var i = 0; i < this.endpoints.length; i++) {
			if (this.endpoints[i].address == addr) {
				return this.endpoints[i]
			}
		}
	}
}


class Capability {
	device: Device;
	id: number;
	descriptor: CapabilityDescriptor;
	type: number;
	data: Buffer;
	constructor(device, id) {
		this.device = device
		this.id = id
		this.descriptor = (this.device as any)._bosDescriptor.capabilities[this.id]
		this.type = this.descriptor.bDevCapabilityType
		this.data = this.descriptor.dev_capability_data
	}
}

class Endpoint extends EventEmitter implements EndpointType {
	device: Device;
	descriptor: EndpointDescriptor;
	address: number;
	transferType: number;
	timeout = 0;
	direction: string;
	pollTransfers: Transfer[];
	pollTransferSize: number;
	pollActive: boolean;
	pollPending: number;

	constructor(device: Device, descriptor: EndpointDescriptor) {
		super();
		this.device = device
		this.descriptor = descriptor
		this.address = descriptor.bEndpointAddress
		this.transferType = descriptor.bmAttributes & 0x03
	}

	clearHalt(callback) {
		return (this.device as any).__clearHalt(this.address, callback);
	}

	makeTransfer(timeout, callback) {
		return new usb.Transfer(this.device, this.address, this.transferType, timeout, callback)
	}

	startPollInternal(nTransfers?: number, transferSize?: number, callback?) {
		if (this.pollTransfers) {
			throw new Error("Polling already active")
		}

		nTransfers = nTransfers || 3;
		this.pollTransferSize = transferSize || this.descriptor.wMaxPacketSize;
		this.pollActive = true
		this.pollPending = 0

		var transfers = []
		for (var i = 0; i < nTransfers; i++) {
			transfers[i] = this.makeTransfer(0, callback)
		}
		return transfers;
	}

	stopPoll(cb?) {
		if (!this.pollTransfers) {
			throw new Error('Polling is not active.');
		}
		for (var i = 0; i < this.pollTransfers.length; i++) {
			try {
				this.pollTransfers[i].cancel()
			} catch (err) {
				this.emit('error', err);
			}
		}
		this.pollActive = false
		if (cb) this.once('end', cb);
	}

}

class InEndpoint extends Endpoint implements InEndpointType {
	direction = "in"

	constructor(device: Device, descriptor: EndpointDescriptor) {
		super(device, descriptor);
	}


	transfer(length: number, callback: (error: undefined | LibUSBException, data?: Buffer) => void): InEndpointType {
		var self = this
		var buffer = Buffer.alloc(length)

		function cb(error: any, _buf: any, actual: number) {
			callback.call(self, error, buffer.slice(0, actual))
		}

		try {
			this.makeTransfer(this.timeout, cb).submit(buffer)
		} catch (e) {
			process.nextTick(function () { callback.call(self, e); });
		}
		return this;
	}

	startPoll(nTransfers?: number, transferSize?: number) {
		var self = this
		this.pollTransfers = this.startPollInternal(nTransfers, transferSize, transferDone)

		function transferDone(error, buf, actual) {
			if (!error) {
				self.emit("data", buf.slice(0, actual))
			} else if (error.errno != usb.LIBUSB_TRANSFER_CANCELLED) {
				self.emit("error", error)
				self.stopPoll()
			}

			if (self.pollActive) {
				startTransfer(this)
			} else {
				self.pollPending--

				if (self.pollPending == 0) {
					delete self.pollTransfers;
					self.emit('end')
				}
			}
		}

		function startTransfer(t) {
			try {
				t.submit(Buffer.alloc(self.pollTransferSize), transferDone);
			} catch (e) {
				self.emit("error", e);
				self.stopPoll();
			}
		}

		this.pollTransfers.forEach(startTransfer)
		self.pollPending = this.pollTransfers.length
	}
}

class OutEndpoint extends Endpoint implements OutEndpointType {
	direction = "out"

	constructor(device: Device, descriptor: EndpointDescriptor) {
		super(device, descriptor)
	}

	transfer(buffer, cb?) {
		var self = this
		if (!buffer) {
			buffer = Buffer.alloc(0)
		} else if (!isBuffer(buffer)) {
			buffer = Buffer.from(buffer)
		}

		function callback(error, _buf?, _actual?) {
			if (cb) cb.call(self, error)
		}

		try {
			this.makeTransfer(this.timeout, callback).submit(buffer);
		} catch (e) {
			process.nextTick(function () { callback(e); });
		}

		return this;
	}

	transferWithZLP(buf, cb) {
		if (buf.length % this.descriptor.wMaxPacketSize == 0) {
			this.transfer(buf);
			this.transfer(Buffer.alloc(0), cb);
		} else {
			this.transfer(buf, cb);
		}
	}

}

var hotplugListeners = 0;
usb.on('newListener', function (name) {
	if (name !== 'attach' && name !== 'detach') return;
	if (++hotplugListeners === 1) {
		usb._enableHotplugEvents();
	}
});

usb.on('removeListener', function (name) {
	if (name !== 'attach' && name !== 'detach') return;
	if (--hotplugListeners === 0) {
		usb._disableHotplugEvents();
	}
});
