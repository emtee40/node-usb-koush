const usb = require("bindings")("usb_bindings")

export const Constants = usb as {
	/**
	 * In the context of a \ref libusb_device_descriptor "device descriptor",
	 * this bDeviceClass value indicates that each interface specifies its
	 * own class information and all interfaces operate independently.
	 */
	LIBUSB_CLASS_PER_INTERFACE: number;
	/** Audio class */
	LIBUSB_CLASS_AUDIO: number;
	/** Communications class */
	LIBUSB_CLASS_COMM: number;
	/** Human Interface Device class */
	LIBUSB_CLASS_HID: number;
	/** Printer class */
	LIBUSB_CLASS_PRINTER: number;
	/** Image class */
	LIBUSB_CLASS_PTP: number;
	/** Mass storage class */
	LIBUSB_CLASS_MASS_STORAGE: number;
	/** Hub class */
	LIBUSB_CLASS_HUB: number;
	/** Data class */
	LIBUSB_CLASS_DATA: number;
	/** Wireless class */
	LIBUSB_CLASS_WIRELESS: number;
	/** Application class */
	LIBUSB_CLASS_APPLICATION: number;
	/** Class is vendor-specific */
	LIBUSB_CLASS_VENDOR_SPEC: number;

	// libusb_standard_request
	/** Request status of the specific recipient */
	LIBUSB_REQUEST_GET_STATUS: number;
	/** Clear or disable a specific feature */
	LIBUSB_REQUEST_CLEAR_FEATURE: number;
	/** Set or enable a specific feature */
	LIBUSB_REQUEST_SET_FEATURE: number;
	/** Set device address for all future accesses */
	LIBUSB_REQUEST_SET_ADDRESS: number;
	/** Get the specified descriptor */
	LIBUSB_REQUEST_GET_DESCRIPTOR: number;
	/** Used to update existing descriptors or add new descriptors */
	LIBUSB_REQUEST_SET_DESCRIPTOR: number;
	/** Get the current device configuration value */
	LIBUSB_REQUEST_GET_CONFIGURATION: number;
	/** Set device configuration */
	LIBUSB_REQUEST_SET_CONFIGURATION: number;
	/** Return the selected alternate setting for the specified interface */
	LIBUSB_REQUEST_GET_INTERFACE: number;
	/** Select an alternate interface for the specified interface */
	LIBUSB_REQUEST_SET_INTERFACE: number;
	/** Set then report an endpoint's synchronization frame */
	LIBUSB_REQUEST_SYNCH_FRAME: number;

	// libusb_descriptor_type
	/** Device descriptor. See libusb_device_descriptor. */
	LIBUSB_DT_DEVICE: number;
	/** Configuration descriptor. See libusb_config_descriptor. */
	LIBUSB_DT_CONFIG: number;
	/** String descriptor */
	LIBUSB_DT_STRING: number;
	/** Interface descriptor. See libusb_interface_descriptor. */
	LIBUSB_DT_INTERFACE: number;
	/** Endpoint descriptor. See libusb_endpoint_descriptor. */
	LIBUSB_DT_ENDPOINT: number;
	/** HID descriptor */
	LIBUSB_DT_HID: number;
	/** HID report descriptor */
	LIBUSB_DT_REPORT: number;
	/** Physical descriptor */
	LIBUSB_DT_PHYSICAL: number;
	/** Hub descriptor */
	LIBUSB_DT_HUB: number;

	// libusb_endpoint_direction
	/** In: device-to-host */
	LIBUSB_ENDPOINT_IN: number;
	/** Out: host-to-device */
	LIBUSB_ENDPOINT_OUT: number;

	// libusb_transfer_type
	/** Control endpoint */
	LIBUSB_TRANSFER_TYPE_CONTROL: number;
	/** Isochronous endpoint */
	LIBUSB_TRANSFER_TYPE_ISOCHRONOUS: number;
	/** Bulk endpoint */
	LIBUSB_TRANSFER_TYPE_BULK: number;
	/** Interrupt endpoint */
	LIBUSB_TRANSFER_TYPE_INTERRUPT: number;

	// libusb_iso_sync_type
	/** No synchronization */
	LIBUSB_ISO_SYNC_TYPE_NONE: number;
	/** Asynchronous */
	LIBUSB_ISO_SYNC_TYPE_ASYNC: number;
	/** Adaptive */
	LIBUSB_ISO_SYNC_TYPE_ADAPTIVE: number;
	/** Synchronous */
	LIBUSB_ISO_SYNC_TYPE_SYNC: number;

	// libusb_iso_usage_type
	/** Data endpoint */
	LIBUSB_ISO_USAGE_TYPE_DATA: number;
	/** Feedback endpoint */
	LIBUSB_ISO_USAGE_TYPE_FEEDBACK: number;
	/** Implicit feedback Data endpoint */
	LIBUSB_ISO_USAGE_TYPE_IMPLICIT: number;

	// libusb_transfer_status
	/**
	 * Transfer completed without error. Note that this does not indicate
	 * that the entire amount of requested data was transferred.
	 */
	LIBUSB_TRANSFER_COMPLETED: number;
	/** Transfer failed */
	LIBUSB_TRANSFER_ERROR: number;
	/** Transfer timed out */
	LIBUSB_TRANSFER_TIMED_OUT: number;
	/** Transfer was cancelled */
	LIBUSB_TRANSFER_CANCELLED: number;
	/**
	 * For bulk/interrupt endpoints: halt condition detected (endpoint
	 * stalled). For control endpoints: control request not supported.
	 */
	LIBUSB_TRANSFER_STALL: number;
	/** Device was disconnected */
	LIBUSB_TRANSFER_NO_DEVICE: number;
	/** Device sent more data than requested */
	LIBUSB_TRANSFER_OVERFLOW: number;

	// libusb_transfer_flags
	/** Report short frames as errors */
	LIBUSB_TRANSFER_SHORT_NOT_OK: number;
	/**
	 * Automatically free() transfer buffer during libusb_free_transfer().
	 * Note that buffers allocated with libusb_dev_mem_alloc() should not
	 * be attempted freed in this way, since free() is not an appropriate
	 * way to release such memory.
	 */
	LIBUSB_TRANSFER_FREE_BUFFER: number;
	/**
	 * Automatically call libusb_free_transfer() after callback returns.
	 * If this flag is set, it is illegal to call libusb_free_transfer()
	 * from your transfer callback, as this will result in a double-free
	 * when this flag is acted upon.
	 */
	LIBUSB_TRANSFER_FREE_TRANSFER: number;

	// libusb_request_type
	/** Standard */
	LIBUSB_REQUEST_TYPE_STANDARD: number;
	/** Class */
	LIBUSB_REQUEST_TYPE_CLASS: number;
	/** Vendor */
	LIBUSB_REQUEST_TYPE_VENDOR: number;
	/** Reserved */
	LIBUSB_REQUEST_TYPE_RESERVED: number;

	// libusb_request_recipient
	/** Device */
	LIBUSB_RECIPIENT_DEVICE: number;
	/** Interface */
	LIBUSB_RECIPIENT_INTERFACE: number;
	/** Endpoint */
	LIBUSB_RECIPIENT_ENDPOINT: number;
	/** Other */
	LIBUSB_RECIPIENT_OTHER: number;

	LIBUSB_CONTROL_SETUP_SIZE: number;

	// libusb_error
	/** Input/output error */
	LIBUSB_ERROR_IO: number;
	/** Invalid parameter */
	LIBUSB_ERROR_INVALID_PARAM: number;
	/** Access denied (insufficient permissions) */
	LIBUSB_ERROR_ACCESS: number;
	/** No such device (it may have been disconnected) */
	LIBUSB_ERROR_NO_DEVICE: number;
	/** Entity not found */
	LIBUSB_ERROR_NOT_FOUND: number;
	/** Resource busy */
	LIBUSB_ERROR_BUSY: number;
	/** Operation timed out */
	LIBUSB_ERROR_TIMEOUT: number;
	/** Overflow */
	LIBUSB_ERROR_OVERFLOW: number;
	/** Pipe error */
	LIBUSB_ERROR_PIPE: number;
	/** System call interrupted (perhaps due to signal) */
	LIBUSB_ERROR_INTERRUPTED: number;
	/** Insufficient memory */
	LIBUSB_ERROR_NO_MEM: number;
	/** Operation not supported or unimplemented on this platform */
	LIBUSB_ERROR_NOT_SUPPORTED: number;
	/** Other error */
	LIBUSB_ERROR_OTHER: number;
};
