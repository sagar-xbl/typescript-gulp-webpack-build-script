// import { SocketIOClient } from 'socket.io-client';
import { DatafeedBase } from './datafeed-base';
import { QuotesProvider } from './quotes-provider';
import { Requester } from './requester';

export class Datafeed extends DatafeedBase {
	public constructor(datafeedURL: string, socket: any, updateFrequency: number = 10 * 1000) {
		// const socket: SocketIOClient.Socket = io(datafeedURL);
		const requester = new Requester();
		const quotesProvider = new QuotesProvider(datafeedURL, requester);
		super(socket, datafeedURL, quotesProvider, requester, updateFrequency);
	}
}
