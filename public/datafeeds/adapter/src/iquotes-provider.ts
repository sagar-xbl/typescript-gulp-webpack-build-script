import { QuoteData } from '../../../charting_library/datafeed-api';

import {
	OkResponse,
} from './helpers';

export interface QuotesResponse extends OkResponse {
	d: QuoteData[];
}

export interface IQuotesProvider {
	// tslint:disable-next-line:variable-name tv-variable-name
	getQuotes(symbols: string[]): Promise<QuoteData[]>;
}
