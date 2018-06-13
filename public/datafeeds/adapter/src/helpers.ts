export interface RequestParams {
	[paramName: string]: string | string[] | number;
}

export interface Response {
	s: string;
}

export interface OkResponse extends Response {
	status: 'success';
}

export interface ErrorResponse {
	status: 'fail';
	error: string;
}

/**
 * If you want to enable logs from datafeed set it to `true`
 */
const isLoggingEnabled = true;
export function logMessage(message: string): void {
	if (isLoggingEnabled) {
		const now = new Date();
		console.log(`${now.toLocaleTimeString()}.${now.getMilliseconds()}> ${message}`);
	}
}

export function getErrorMessage(error: string | Error | undefined): string {
	if (error === undefined) {
		return '';
	} else if (typeof error === 'string') {
		return error;
	}

	return error.message;
}
