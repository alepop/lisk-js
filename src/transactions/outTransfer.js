/*
 * Copyright © 2017 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 *
 */
/**
 * Transfer module provides functions for creating "in" transfer transactions (balance transfers to
 * an individual dapp account).
 * @class transfer
 */
import cryptoModule from '../crypto';
import { OUT_TRANSFER_FEE } from '../constants';
import slots from '../time/slots';
import { prepareTransaction } from './utils';

/**
 * @method createOutTransfer
 * @param dappId
 * @param transactionId
 * @param recipientId
 * @param amount
 * @param secret
 * @param secondSecret
 * @param timeOffset
 *
 * @return {Object}
 */

export default function createOutTransfer(
	dappId, transactionId, recipientId, amount, secret, secondSecret, timeOffset,
) {
	const keys = cryptoModule.getKeys(secret);

	const transaction = {
		type: 7,
		amount,
		fee: OUT_TRANSFER_FEE,
		recipientId,
		senderPublicKey: keys.publicKey,
		timestamp: slots.getTimeWithOffset(timeOffset),
		asset: {
			outTransfer: {
				dappId,
				transactionId,
			},
		},
	};

	return prepareTransaction(transaction, secret, secondSecret);
}
