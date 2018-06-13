import {
	Bar,
	LibrarySymbolInfo,
	SubscribeBarsCallback,
} from '../../../charting_library/datafeed-api';

import {
	logMessage,
} from './helpers';

interface DataSubscriber {
	symbolInfo: LibrarySymbolInfo;
	resolution: string;
	lastBarTime: number | null;
	listener: SubscribeBarsCallback;
}

interface DataSubscribers {
	[guid: string]: DataSubscriber;
}

interface SymbolData {
	symbol: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	timestamp: number;
	resolution: string;
}

export class DataPulseProvider {
	private _subscribers: DataSubscribers = {};
	private _requestsPending: number = 0;
	private readonly _socket: any;

	public constructor(socket: any, updateFrequency: number) {
		this._socket = socket;
		// setInterval(this._updateData.bind(this), updateFrequency);
	}

	public subscribeBars(symbolInfo: LibrarySymbolInfo, resolution: string, newDataCallback: SubscribeBarsCallback, listenerGuid: string): void {
		if (this._subscribers.hasOwnProperty(listenerGuid)) {
			logMessage(`DataPulseProvider: already has subscriber with id=${listenerGuid}`);
			return;
		}

		this._subscribers[listenerGuid] = {
			lastBarTime: null,
			listener: newDataCallback,
			resolution: resolution,
			symbolInfo: symbolInfo,
		};

		this._socket.emit('subscribe symbol', symbolInfo.name);
		this._socket.on('symbol update', (symbolData: SymbolData) => {
			this._updateData.bind(this);
			this._updateData(symbolData);
		});

		logMessage(`DataPulseProvider: subscribed for #${listenerGuid} - {${symbolInfo.name}, ${resolution}}`);
	}

	public unsubscribeBars(listenerGuid: string): void {
		this._socket.emit('unsubscribe symbol', this._subscribers[listenerGuid].symbolInfo.name);
		this._socket.on('symbol unsubscribed', () => {
			delete this._subscribers[listenerGuid];
			logMessage(`DataPulseProvider: unsubscribed for #${listenerGuid}`);
		});
	}

	private _updateData(symbolData: SymbolData): void {
		if (this._requestsPending > 0) {
			return;
		}

		this._requestsPending = 0;
		for (const listenerGuid in this._subscribers) { // tslint:disable-line:forin
			this._requestsPending += 1;

			if (this._subscribers[listenerGuid].symbolInfo.name === symbolData.symbol) {
				if (resolutionMatch(symbolData.resolution, this._subscribers[listenerGuid].resolution)) {
					this._updateDataForSubscriber(listenerGuid, symbolData);
				}
			}
		}
	}

	private _updateDataForSubscriber(listenerGuid: string, symbolData: SymbolData): void {
		if (!symbolData) {
			this._requestsPending -= 1;
			logMessage(`DataPulseProvider: data for #${listenerGuid} updated with error, pending=${this._requestsPending}`);
		}

		// const subscriptionRecord = this._subscribers[listenerGuid];

		// const rangeEndTime = parseInt((Date.now() / 1000).toString());

		// BEWARE: please note we really need 2 bars, not the only last one
		// see the explanation below. `10` is the `large enough` value to work around holidays
		// const rangeStartTime = rangeEndTime - periodLengthSeconds(subscriptionRecord.resolution, 10);

		const bar: Bar = {
			time: symbolData.timestamp,
			close: symbolData.close,
			open: symbolData.open,
			high: symbolData.high,
			low: symbolData.low,
			volume: symbolData.volume
		};

		this._onSubscriberDataReceived(listenerGuid, bar);
	}

	private _onSubscriberDataReceived(listenerGuid: string, bar: Bar): void {
		// means the subscription was cancelled while waiting for data
		if (!this._subscribers.hasOwnProperty(listenerGuid)) {
			logMessage(`DataPulseProvider: Data comes for already unsubscribed subscription #${listenerGuid}`);
			return;
		}
		console.log('BAR', bar);

		// const bars = result.bars;
		// if (bars.length === 0) {
		// 	return;
		// }

		// const lastBar = bars[bars.length - 1];
		const subscriptionRecord = this._subscribers[listenerGuid];

		// if (subscriptionRecord.lastBarTime !== null && lastBar.time < subscriptionRecord.lastBarTime) {
		// 	return;
		// }

		// const isNewBar = subscriptionRecord.lastBarTime !== null && lastBar.time > subscriptionRecord.lastBarTime;

		// Pulse updating may miss some trades data (ie, if pulse period = 10 secods and new bar is started 5 seconds later after the last update, the
		// old bar's last 5 seconds trades will be lost). Thus, at fist we should broadcast old bar updates when it's ready.
		// if (isNewBar) {
		// 	if (bars.length < 2) {
		// 		throw new Error('Not enough bars in history for proper pulse update. Need at least 2.');
		// 	}

		// 	const previousBar = bars[bars.length - 2];
		// 	subscriptionRecord.listener(previousBar);
		// }

		subscriptionRecord.lastBarTime = bar.time;
		subscriptionRecord.listener(bar);

		this._requestsPending -= 1;
		logMessage(`DataPulseProvider: data for #${listenerGuid} updated successfully, pending=${this._requestsPending}`);
	}
}

function resolutionMatch(resolution: string, subscribedResolution: string): boolean {
	if (typeof resolution === 'undefined') {
		return false;
	}

	if (resolution === 'D' && subscribedResolution.match(/[0-9]*D/)) {
		return true;
	}

	if (resolution === subscribedResolution) {
		return true;
	}

	return false;
}

// function periodLengthSeconds(resolution: string, requiredPeriodsCount: number): number {
// 	let daysCount = 0;

// 	if (resolution === 'D') {
// 		daysCount = requiredPeriodsCount;
// 	} else if (resolution === 'M') {
// 		daysCount = 31 * requiredPeriodsCount;
// 	} else if (resolution === 'W') {
// 		daysCount = 7 * requiredPeriodsCount;
// 	} else {
// 		daysCount = requiredPeriodsCount * parseInt(resolution) / (24 * 60);
// 	}

// 	return daysCount * 24 * 60 * 60;
// }
