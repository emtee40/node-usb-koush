import { EventEmitter } from "events";

export interface LibUSBException extends Error {
	errno: number;
}

/** Represents a USB device. */
export interface Device {
    /** Timeout in milliseconds to use for control transfers. */
    timeout: number;
  
    /** Integer USB device number */
    busNumber: number;
  
    /** Integer USB device address */
    deviceAddress: number;
  
    /** Array containing the USB device port numbers, or `undefined` if not supported on this platform. */
    portNumbers: number[];
  
    /** Object with properties for the fields of the device descriptor. */
    deviceDescriptor: DeviceDescriptor;
  
    /** Object with properties for the fields of the active configuration descriptor. */
    configDescriptor: ConfigDescriptor;
  
    /** Contains all config descriptors of the device (same structure as .configDescriptor above) */
    allConfigDescriptors: ConfigDescriptor[];
  
    /** Contains the parent of the device, such as a hub. If there is no parent this property is set to `null`. */
    parent: Device;
  
    /** List of Interface objects for the interfaces of the default configuration of the device. */
    interfaces: Interface[];
  
    __open(): void;
    __getConfigDescriptor(): ConfigDescriptor;
    __claimInterface(addr: number): void;
    __detachKernelDriver(addr: number): void;
    __attachKernelDriver(addr: number): void;
    __isKernelDriverActive(addr: number): boolean;
  
    /**
     * Open the device.
     * @param defaultConfig
     */
    open(defaultConfig?: boolean): void;
  
    /**
     * Close the device.
     *
     * The device must be open to use this method.
     */
    close(): void;
  
    /**
     * Return the interface with the specified interface number.
     *
     * The device must be open to use this method.
     * @param addr
     */
    interface(addr: number): Interface;
  
    /**
     * Perform a control transfer with `libusb_control_transfer`.
     *
     * Parameter `data_or_length` can be an integer length for an IN transfer, or a `Buffer` for an OUT transfer. The type must match the direction specified in the MSB of bmRequestType.
     *
     * The `data` parameter of the callback is always undefined for OUT transfers, or will be passed a Buffer for IN transfers.
     *
     * The device must be open to use this method.
     * @param bmRequestType
     * @param bRequest
     * @param wValue
     * @param wIndex
     * @param data_or_length
     * @param callback
     */
    controlTransfer(bmRequestType: number, bRequest: number, wValue: number, wIndex: number, data_or_length: number | Buffer,
                    callback: (error: undefined | LibUSBException, buffer?: Buffer) => void): Device;
  
    /**
     * Perform a control transfer to retrieve a string descriptor
     *
     * The device must be open to use this method.
     * @param desc_index
     * @param callback
     */
     getStringDescriptor(desc_index: number): Promise<string>;
  
    /**
     * Perform a control transfer to retrieve an object with properties for the fields of the Binary Object Store descriptor.
     *
     * The device must be open to use this method.
     * @param callback
     */
    getBosDescriptor(): Promise<BosDescriptor>;
  
    /**
     * Retrieve a list of Capability objects for the Binary Object Store capabilities of the device.
     *
     * The device must be open to use this method.
     * @param callback
     */
    getCapabilities(): Promise<Capability[]>;
  
    /**
     * Set the device configuration to something other than the default (0). To use this, first call `.open(false)` (which tells it not to auto configure),
     * then before claiming an interface, call this method.
     *
     * The device must be open to use this method.
     * @param desired
     * @param callback
     */
    setConfiguration(desired: number): Promise<void>;
  
    /**
     * Performs a reset of the device. Callback is called when complete.
     *
     * The device must be open to use this method.
     * @param callback
     */
    reset(callback: (error: undefined | LibUSBException) => void): void;
  }
  
  /** A structure representing the standard USB device descriptor */
  export interface DeviceDescriptor {
    /** Size of this descriptor (in bytes) */
    bLength: number;
  
    /** Descriptor type. */
    bDescriptorType: number;
  
    /** USB specification release number in binary-coded decimal. */
    bcdUSB: number;
  
    /** USB-IF class code for the device. */
    bDeviceClass: number;
  
    /** USB-IF subclass code for the device, qualified by the bDeviceClass value. */
    bDeviceSubClass: number;
  
    /** USB-IF protocol code for the device, qualified by the bDeviceClass and bDeviceSubClass values. */
    bDeviceProtocol: number;
  
    /** Maximum packet size for endpoint 0. */
    bMaxPacketSize0: number;
  
    /** USB-IF vendor ID. */
    idVendor: number;
  
    /** USB-IF product ID. */
    idProduct: number;
  
    /** Device release number in binary-coded decimal. */
    bcdDevice: number;
  
    /** Index of string descriptor describing manufacturer. */
    iManufacturer: number;
  
    /** Index of string descriptor describing product. */
    iProduct: number;
  
    /** Index of string descriptor containing device serial number. */
    iSerialNumber: number;
  
    /** Number of possible configurations. */
    bNumConfigurations: number;
  }
  
  /** A structure representing the standard USB configuration descriptor */
  export interface ConfigDescriptor {
    /** Size of this descriptor (in bytes) */
    bLength: number;
  
    /** Descriptor type. */
    bDescriptorType: number;
  
    /** Total length of data returned for this configuration. */
    wTotalLength: number;
  
    /** Number of interfaces supported by this configuration. */
    bNumInterfaces: number;
  
    /** Identifier value for this configuration. */
    bConfigurationValue: number;
  
    /** Index of string descriptor describing this configuration. */
    iConfiguration: number;
  
    /** Configuration characteristics. */
    bmAttributes: number;
  
    /** Maximum power consumption of the USB device from this bus in this configuration when the device is fully operation. */
    bMaxPower: number;
  
    /** Extra descriptors. */
    extra: Buffer;
  
    /** Array of interfaces supported by this configuration. */
    interfaces: InterfaceDescriptor[][];
  }
  
  /** A structure representing the Binary Device Object Store (BOS) descriptor */
  export interface BosDescriptor {
    /** Size of this descriptor (in bytes) */
    bLength: number;
  
    /** Descriptor type. */
    bDescriptorType: number;
  
    /** Length of this descriptor and all of its sub descriptors. */
    wTotalLength: number;
  
    /** The number of separate device capability descriptors in the BOS. */
    bNumDeviceCaps: number;
  
    /** Device Capability Descriptors */
    capabilities: CapabilityDescriptor[];
  }
  
  /** A generic representation of a BOS Device Capability descriptor */
  export interface CapabilityDescriptor {
    /** Size of this descriptor (in bytes) */
    bLength: number;
  
    /** Descriptor type. */
    bDescriptorType: number;
  
    /** Device Capability type. */
    bDevCapabilityType: number;
  
    /** Device Capability data (bLength - 3 bytes) */
    dev_capability_data: Buffer;
  }
  
  export interface Capability {
    /** Object with fields from the capability descriptor -- see libusb documentation or USB spec. */
    descriptor: CapabilityDescriptor;
  
    /** Integer capability type. */
    type: number;
  
    /** Buffer capability data. */
    data: Buffer;
  }
  
  export declare class Interface {
    /** Integer interface number. */
    interfaceNumber: number;
  
    /** Integer alternate setting number. */
    altSetting: number;
  
    /** Object with fields from the interface descriptor -- see libusb documentation or USB spec. */
    descriptor: InterfaceDescriptor;
  
    /** List of endpoints on this interface: InEndpoint and OutEndpoint objects. */
    endpoints: Endpoint[];
  
    constructor(device: Device, id: number);
  
    /**
     * Claims the interface. This method must be called before using any endpoints of this interface.
     *
     * The device must be open to use this method.
     */
    claim(): void;
  
    /**
     * Releases the interface and resets the alternate setting. Calls callback when complete.
     *
     * It is an error to release an interface with pending transfers.
     *
     * The device must be open to use this method.
     * @param callback
     */
    release(callback?: (error: undefined | LibUSBException) => void): void;
  
    /**
     * Releases the interface and resets the alternate setting. Calls callback when complete.
     *
     * It is an error to release an interface with pending transfers. If the optional closeEndpoints
     * parameter is true, any active endpoint streams are stopped (see `Endpoint.stopStream`),
     * and the interface is released after the stream transfers are cancelled. Transfers submitted
     * individually with `Endpoint.transfer` are not affected by this parameter.
     *
     * The device must be open to use this method.
     * @param closeEndpoints
     * @param callback
     */
    release(closeEndpoints?: boolean, callback?: (error: undefined | LibUSBException) => void): void;
  
    /**
     * Returns `false` if a kernel driver is not active; `true` if active.
     *
     * The device must be open to use this method.
     */
    isKernelDriverActive(): boolean;
  
    /**
     * Detaches the kernel driver from the interface.
     *
     * The device must be open to use this method.
     */
    detachKernelDriver(): void;
  
    /**
     * Re-attaches the kernel driver for the interface.
     *
     * The device must be open to use this method.
     */
    attachKernelDriver(): void;
  
    /**
     * Sets the alternate setting. It updates the `interface.endpoints` array to reflect the endpoints found in the alternate setting.
     *
     * The device must be open to use this method.
     * @param altSetting
     * @param callback
     */
    setAltSetting(altSetting: number, callback: (error: undefined | LibUSBException) => void): void;
  
    /**
     * Return the InEndpoint or OutEndpoint with the specified address.
     *
     * The device must be open to use this method.
     * @param addr
     */
    endpoint(addr: number): Endpoint;
  }
  
  /** A structure representing the standard USB interface descriptor */
  export interface InterfaceDescriptor {
    /** Size of this descriptor (in bytes) */
    bLength: number;
  
    /** Descriptor type. */
    bDescriptorType: number;
  
    /** Number of this interface. */
    bInterfaceNumber: number;
  
    /** Value used to select this alternate setting for this interface. */
    bAlternateSetting: number;
  
    /** Number of endpoints used by this interface (excluding the control endpoint). */
    bNumEndpoints: number;
  
    /** USB-IF class code for this interface. */
    bInterfaceClass: number;
  
    /** USB-IF subclass code for this interface, qualified by the bInterfaceClass value. */
    bInterfaceSubClass: number;
  
    /** USB-IF protocol code for this interface, qualified by the bInterfaceClass and bInterfaceSubClass values. */
    bInterfaceProtocol: number;
  
    /** Index of string descriptor describing this interface. */
    iInterface: number;
  
    /** Extra descriptors. */
    extra: Buffer;
  
    /** Array of endpoint descriptors. */
    endpoints: EndpointDescriptor[];
  }
  
  /** Common base for InEndpoint and OutEndpoint. */
  export interface Endpoint extends EventEmitter {
    /** Endpoint direction: `"in"` or `"out"`. */
    direction: string;
  
    /** Endpoint type: `usb.LIBUSB_TRANSFER_TYPE_BULK`, `usb.LIBUSB_TRANSFER_TYPE_INTERRUPT`, or `usb.LIBUSB_TRANSFER_TYPE_ISOCHRONOUS`. */
    transferType: number;
  
    /** Sets the timeout in milliseconds for transfers on this endpoint. The default, `0`, is infinite timeout. */
    timeout: number;
  
    /** Object with fields from the endpoint descriptor -- see libusb documentation or USB spec. */
    descriptor: EndpointDescriptor;
  
    /** Clear the halt/stall condition for this endpoint. */
    clearHalt(callback: (error: undefined | LibUSBException) => void): void;
  
    /**
     * Create a new `Transfer` object for this endpoint.
     *
     * The passed callback will be called when the transfer is submitted and finishes. Its arguments are the error (if any), the submitted buffer, and the amount of data actually written (for
     * OUT transfers) or read (for IN transfers).
     *
     * @param timeout Timeout for the transfer (0 means unlimited).
     * @param callback Transfer completion callback.
     */
    makeTransfer(timeout: number, callback: (error: undefined | LibUSBException, buffer?: Buffer, actualLength?: number) => void): Transfer;
  }
  
  /** Endpoints in the IN direction (device->PC) have this type. */
  export interface InEndpoint extends Endpoint {
    direction: string;
    transferType: number;
    timeout: number;
    descriptor: EndpointDescriptor;
    clearHalt(callback: (error: undefined | LibUSBException) => void): void;
    makeTransfer(timeout: number, callback: (error: undefined | LibUSBException, buffer?: Buffer, actualLength?: number) => void): Transfer;
    
    /**
     * Perform a transfer to read data from the endpoint.
     *
     * If length is greater than maxPacketSize, libusb will automatically split the transfer in multiple packets, and you will receive one callback with all data once all packets are complete.
     *
     * `this` in the callback is the InEndpoint object.
     *
     * The device must be open to use this method.
     * @param length
     * @param callback
     */
    transfer(length: number, callback: (error: undefined | LibUSBException, data?: Buffer) => void): InEndpoint;
  
    /**
     * Start polling the endpoint.
     *
     * The library will keep `nTransfers` transfers of size `transferSize` pending in the kernel at all times to ensure continuous data flow.
     * This is handled by the libusb event thread, so it continues even if the Node v8 thread is busy. The `data` and `error` events are emitted as transfers complete.
     *
     * The device must be open to use this method.
     * @param nTransfers
     * @param transferSize
     */
    startPoll(nTransfers?: number, transferSize?: number): void;
  
    /**
     * Stop polling.
     *
     * Further data may still be received. The `end` event is emitted and the callback is called once all transfers have completed or canceled.
     *
     * The device must be open to use this method.
     * @param callback
     */
    stopPoll(callback?: () => void): void;
  }
  
  /** Endpoints in the OUT direction (PC->device) have this type. */
  export interface OutEndpoint extends Endpoint {
    direction: string;
    transferType: number;
    timeout: number;
    descriptor: EndpointDescriptor;
    clearHalt(callback: (error: undefined | LibUSBException) => void): void;
    makeTransfer(timeout: number, callback: (error: undefined | LibUSBException, buffer?: Buffer, actualLength?: number) => void): Transfer;
    
    /**
     * Perform a transfer to write `data` to the endpoint.
     *
     * If length is greater than maxPacketSize, libusb will automatically split the transfer in multiple packets, and you will receive one callback once all packets are complete.
     *
     * `this` in the callback is the OutEndpoint object.
     *
     * The device must be open to use this method.
     * @param buffer
     * @param callback
     */
    transfer(buffer: Buffer, callback: (error: undefined | LibUSBException) => void): OutEndpoint;
    transferWithZLP(buffer: Buffer, callback: (error: undefined | LibUSBException) => void): void;
  }
  
  /** A structure representing the standard USB endpoint descriptor */
  export interface EndpointDescriptor {
    /** Size of this descriptor (in bytes) */
    bLength: number;
  
    /** Descriptor type. */
    bDescriptorType: number;
  
    /** The address of the endpoint described by this descriptor. */
    bEndpointAddress: number;
  
    /** Attributes which apply to the endpoint when it is configured using the bConfigurationValue. */
    bmAttributes: number;
  
    /** Maximum packet size this endpoint is capable of sending/receiving. */
    wMaxPacketSize: number;
  
    /** Interval for polling endpoint for data transfers. */
    bInterval: number;
  
    /** For audio devices only: the rate at which synchronization feedback is provided. */
    bRefresh: number;
  
    /** For audio devices only: the address if the synch endpoint. */
    bSynchAddress: number;
  
    /**
     * Extra descriptors.
     *
     * If libusb encounters unknown endpoint descriptors, it will store them here, should you wish to parse them.
     */
    extra: Buffer;
  }
  
  /** Represents a USB transfer */
  export interface Transfer {
    /**
     * (Re-)submit the transfer.
     *
     * @param buffer Buffer where data will be written (for IN transfers) or read from (for OUT transfers).
     */
    submit(buffer: Buffer): Transfer;
  
    /**
     * Cancel the transfer.
     *
     * Returns `true` if the transfer was canceled, `false` if it wasn't in pending state.
     */
    cancel(): boolean;
  }
  