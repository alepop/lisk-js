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
import { PopsicleError } from 'popsicle';

const privateApi = require('../../src/api/privateApi');

afterEach(() => sandbox.restore());

describe('privateApi module', () => {
	const port = 7000;
	const localNode = 'localhost';
	const externalNode = 'external';
	const sslNode = 'sslPeer';
	const externalTestnetNode = 'testnet';
	const mainnetNethash = 'ed14889723f24ecc54871d058d98ce91ff2f973192075c0155ba2b7b70ad2511';
	const testnetNethash = 'da3ed6a45429278bac2666961289ca17ad86595d33b31037615d4b8e8f158bba';
	const GET = 'GET';
	const POST = 'POST';
	const defaultMethod = POST;
	const defaultEndpoint = 'transactions';
	const defaultData = 'testData';
	const defaultPeers = [localNode, externalNode];
	const defaultSSLPeers = [localNode, externalNode, sslNode];
	const defaultTestnetPeers = [localNode, externalTestnetNode];

	let LSK;
	let sendRequestResult;
	let sendRequestStub;

	beforeEach(() => {
		LSK = {
			randomPeer: false,
			currentPeer: localNode,
			defaultPeers: [].concat(defaultPeers),
			defaultSSLPeers: [].concat(defaultSSLPeers),
			defaultTestnetPeers: [].concat(defaultTestnetPeers),
			bannedPeers: [],
			port,
			options: {
				node: localNode,
			},
			nethash: {
				foo: 'bar',
			},

			parseOfflineRequests: () => ({
				requestMethod: GET,
			}),
			setTestnet: () => {},
			setNode: () => {},
			sendRequest: () => {},
		};
		sendRequestResult = { success: true, sendRequest: true };
		sendRequestStub = sandbox.stub(LSK, 'sendRequest').resolves(Object.assign({}, sendRequestResult));
	});

	describe('#netHashOptions', () => {
		const { netHashOptions } = privateApi;
		let result;

		beforeEach(() => {
			result = netHashOptions.call(LSK);
		});

		it('should return an object with a testnet nethash', () => {
			const { testnet } = result;
			(testnet).should.have.property('Content-Type').and.be.type('string');
			(testnet).should.have.property('nethash').and.be.type('string');
			(testnet).should.have.property('broadhash').and.be.type('string');
			(testnet).should.have.property('os').and.be.type('string');
			(testnet).should.have.property('version').and.be.type('string');
			(testnet).should.have.property('minVersion').and.be.type('string');
			(testnet).should.have.property('port').and.be.type('number');
		});
		it('should return an object with a mainnet nethash', () => {
			const { mainnet } = result;
			(mainnet).should.have.property('Content-Type').and.be.type('string');
			(mainnet).should.have.property('nethash').and.be.type('string');
			(mainnet).should.have.property('broadhash').and.be.type('string');
			(mainnet).should.have.property('os').and.be.type('string');
			(mainnet).should.have.property('version').and.be.type('string');
			(mainnet).should.have.property('minVersion').and.be.type('string');
			(mainnet).should.have.property('port').and.be.type('number');
		});
	});

	describe('#getURLPrefix', () => {
		const { getURLPrefix } = privateApi;

		it('should return http when ssl is set to false', () => {
			LSK.ssl = false;
			const result = getURLPrefix.call(LSK);
			(result).should.be.equal('http');
		});

		it('should return https when ssl is set to true', () => {
			LSK.ssl = true;
			const result = getURLPrefix.call(LSK);
			(result).should.be.equal('https');
		});
	});

	describe('#getFullURL', () => {
		const { getFullURL } = privateApi;
		const URLPrefix = 'ftp';

		let getURLPrefixStub;
		let restoreGetURLPrefixStub;
		let result;

		beforeEach(() => {
			getURLPrefixStub = sandbox.stub().returns(URLPrefix);
			// eslint-disable-next-line no-underscore-dangle
			restoreGetURLPrefixStub = privateApi.__set__('getURLPrefix', getURLPrefixStub);
			result = getFullURL.call(LSK);
		});

		afterEach(() => {
			restoreGetURLPrefixStub();
		});

		it('should get the URL prefix', () => {
			(getURLPrefixStub.calledOn(LSK)).should.be.true();
		});

		it('should add the prefix to the node URL and the port', () => {
			(result).should.equal(`${URLPrefix}://${LSK.currentPeer}:${port}`);
		});

		it('should not include a port if not set', () => {
			delete LSK.port;
			result = getFullURL.call(LSK);
			(result).should.equal(`${URLPrefix}://${LSK.currentPeer}`);
		});
	});

	describe('#getPeers', () => {
		const { getPeers } = privateApi;

		describe('with SSL set to true', () => {
			beforeEach(() => {
				LSK.ssl = true;
			});

			it('should return default testnet peers if testnet is set to true', () => {
				LSK.testnet = true;
				const peers = getPeers.call(LSK);
				(peers).should.be.eql(defaultTestnetPeers);
			});

			it('should return default SSL peers if testnet is not set to true', () => {
				LSK.testnet = false;
				const peers = getPeers.call(LSK);
				(peers).should.be.eql(defaultSSLPeers);
			});
		});

		describe('with SSL set to false', () => {
			beforeEach(() => {
				LSK.ssl = false;
			});

			it('should return default testnet peers if testnet is set to true', () => {
				LSK.testnet = true;
				const peers = getPeers.call(LSK);
				(peers).should.be.eql(defaultTestnetPeers);
			});

			it('should return default mainnet peers if testnet is not set to true', () => {
				LSK.testnet = false;
				const peers = getPeers.call(LSK);
				(peers).should.be.eql(defaultPeers);
			});
		});
	});

	describe('#getRandomPeer', () => {
		const { getRandomPeer } = privateApi;
		let getPeersStub;
		let restoreGetPeersStub;

		beforeEach(() => {
			getPeersStub = sandbox.stub().returns([].concat(defaultPeers));
			// eslint-disable-next-line no-underscore-dangle
			restoreGetPeersStub = privateApi.__set__('getPeers', getPeersStub);
		});

		afterEach(() => {
			restoreGetPeersStub();
		});

		it('should throw an error if all relevant peers are banned', () => {
			LSK.bannedPeers = [].concat(defaultPeers);
			(getRandomPeer.bind(LSK)).should.throw('Cannot get random peer: all relevant peers have been banned.');
		});

		it('should get peers', () => {
			getRandomPeer.call(LSK);
			(getPeersStub.calledOn(LSK)).should.be.true();
		});

		it('should return a peer', () => {
			const result = getRandomPeer.call(LSK);
			(LSK.defaultPeers).should.containEql(result);
		});

		it('should randomly select the peer', () => {
			const firstResult = getRandomPeer.call(LSK);
			let nextResult = getRandomPeer.call(LSK);
			// Test will almost certainly time out if not random
			while (nextResult === firstResult) {
				nextResult = getRandomPeer.call(LSK);
			}
		});
	});

	describe('#selectNode', () => {
		const { selectNode } = privateApi;
		const customNode = 'customPeer';
		const getRandomPeerResult = externalNode;

		let getRandomPeerStub;
		let restoreGetRandomPeer;

		beforeEach(() => {
			getRandomPeerStub = sandbox.stub().returns(getRandomPeerResult);
			// eslint-disable-next-line no-underscore-dangle
			restoreGetRandomPeer = privateApi.__set__('getRandomPeer', getRandomPeerStub);
		});

		afterEach(() => {
			restoreGetRandomPeer();
		});

		describe('if a node was provided in the options', () => {
			beforeEach(() => {
				LSK.options.node = customNode;
			});
			describe('if randomPeer is set to false', () => {
				beforeEach(() => {
					LSK.randomPeer = false;
				});

				it('should throw an error if the provided node is banned', () => {
					LSK.bannedPeers = [customNode];
					(selectNode.bind(LSK)).should.throw('Cannot select node: provided node has been banned and randomPeer is not set to true.');
				});

				it('should return the provided node if it is not banned', () => {
					const result = selectNode.call(LSK);
					(result).should.be.equal(customNode);
				});
			});

			describe('if randomPeer is set to true', () => {
				beforeEach(() => {
					LSK.randomPeer = true;
				});

				it('should call getRandomPeer', () => {
					selectNode.call(LSK);
					(getRandomPeerStub.calledOn(LSK)).should.be.true();
				});

				it('should return a random peer', () => {
					const result = selectNode.call(LSK);
					(result).should.be.equal(getRandomPeerResult);
				});
			});
		});

		describe('if a node was not provided in the options', () => {
			beforeEach(() => {
				LSK.options.node = undefined;
			});

			describe('if randomPeer is set to false', () => {
				beforeEach(() => {
					LSK.randomPeer = false;
				});

				it('should throw an error', () => {
					(selectNode.bind(LSK)).should.throw('Cannot select node: no node provided and randomPeer is not set to true.');
				});
			});

			describe('if randomPeer is set to true', () => {
				beforeEach(() => {
					LSK.randomPeer = true;
				});

				it('should call getRandomPeer', () => {
					selectNode.call(LSK);
					(getRandomPeerStub.calledOn(LSK)).should.be.true();
				});

				it('should return a random peer', () => {
					const result = selectNode.call(LSK);
					(result).should.be.equal(getRandomPeerResult);
				});
			});
		});
	});

	describe('#banNode', () => {
		const { banNode } = privateApi;
		let currentNode;

		beforeEach(() => {
			currentNode = LSK.currentPeer;
		});

		it('should add current node to banned peers', () => {
			banNode.call(LSK);

			(LSK.bannedPeers).should.containEql(currentNode);
		});

		it('should not duplicate a banned peer', () => {
			const bannedPeers = [currentNode];
			LSK.bannedPeers = bannedPeers;
			banNode.call(LSK);

			(LSK.bannedPeers).should.be.eql(bannedPeers);
		});
	});

	describe('#checkReDial', () => {
		const { checkReDial } = privateApi;
		let getPeersStub;
		let restoreGetPeersStub;
		let setTestnetStub;

		beforeEach(() => {
			getPeersStub = sandbox.stub().returns([].concat(defaultPeers));
			// eslint-disable-next-line no-underscore-dangle
			restoreGetPeersStub = privateApi.__set__('getPeers', getPeersStub);
			sandbox.stub(privateApi, 'netHashOptions');
			setTestnetStub = sandbox.stub(LSK, 'setTestnet');
		});

		afterEach(() => {
			restoreGetPeersStub();
		});

		describe('with random peer', () => {
			let result;

			beforeEach(() => {
				LSK.randomPeer = true;
			});

			it('should get peers', () => {
				checkReDial.call(LSK);
				(getPeersStub.calledOn(LSK)).should.be.true();
			});

			describe('when nethash is set', () => {
				describe('when the nethash matches the testnet', () => {
					beforeEach(() => {
						LSK.options.nethash = testnetNethash;
						result = checkReDial.call(LSK);
					});

					it('should set testnet to true', () => {
						(setTestnetStub.calledOn(LSK)).should.be.true();
						(setTestnetStub.calledWithExactly(true)).should.be.true();
					});

					it('should return true', () => {
						(result).should.be.true();
					});
				});

				describe('when the nethash matches the mainnet', () => {
					beforeEach(() => {
						LSK.options.nethash = mainnetNethash;
						result = checkReDial.call(LSK);
					});

					it('should set testnet to false', () => {
						(setTestnetStub.calledOn(LSK)).should.be.true();
						(setTestnetStub.calledWithExactly(false)).should.be.true();
					});

					it('should return true', () => {
						(result).should.be.true();
					});
				});

				describe('when the nethash matches neither the mainnet nor the testnet', () => {
					beforeEach(() => {
						LSK.options.nethash = 'abc123';
						result = checkReDial.call(LSK);
					});

					it('should return false', () => {
						(result).should.be.false();
					});
				});
			});

			describe('when nethash is not set', () => {
				beforeEach(() => {
					LSK.options.nethash = undefined;
				});

				it('should return true if there are peers which are not banned', () => {
					LSK.bannedPeers = ['bannedPeer'].concat(LSK.defaultPeers.slice(1));
					result = checkReDial.call(LSK);

					(result).should.be.true();
				});

				it('should return false if there are no peers which are not banned', () => {
					LSK.bannedPeers = [].concat(LSK.defaultPeers);
					result = checkReDial.call(LSK);

					(result).should.be.false();
				});
			});
		});

		describe('without random peer', () => {
			beforeEach(() => {
				LSK.randomPeer = false;
			});

			it('should return false', () => {
				const result = checkReDial.call(LSK);
				(result).should.be.false();
			});
		});
	});

	describe('#createRequestObject', () => {
		let options;
		let expectedObject;

		beforeEach(() => {
			options = {
				limit: 5,
				offset: 3,
				details: defaultData,
			};
			expectedObject = {
				method: GET,
				url: `http://${localNode}:${port}/api/${defaultEndpoint}`,
				headers: LSK.nethash,
				body: {},
			};
		});

		it('should create a valid request object for GET request', () => {
			expectedObject.url += `?limit=${options.limit}&offset=${options.offset}&details=${options.details}`;

			const requestObject = privateApi.createRequestObject.call(LSK, GET, defaultEndpoint, options);
			(requestObject).should.be.eql(expectedObject);
		});

		it('should create a valid request object for POST request', () => {
			expectedObject.body = Object.assign({}, options);
			expectedObject.method = POST;

			const requestObject = privateApi.createRequestObject
				.call(LSK, POST, defaultEndpoint, options);
			(requestObject).should.be.eql(expectedObject);
		});

		it('should create a valid request object for POST request without options', () => {
			expectedObject.method = POST;

			const requestObject = privateApi.createRequestObject.call(LSK, POST, defaultEndpoint);
			(requestObject).should.be.eql(expectedObject);
		});

		it('should create a valid request object for undefined request method without options', () => {
			expectedObject.method = undefined;

			const requestObject = privateApi.createRequestObject.call(LSK, undefined, defaultEndpoint);
			(requestObject).should.be.eql(expectedObject);
		});
	});

	describe('#sendRequestPromise', () => {
		const { sendRequestPromise } = privateApi;

		let options;
		let createRequestObjectResult;
		let createRequestObjectStub;
		let restoreCreateRequestObject;
		let sendRequestPromiseResult;

		beforeEach(() => {
			options = {
				key1: 'value 2',
				key3: 4,
			};
			createRequestObjectResult = {
				method: defaultMethod,
				url: `http://${localNode}:${port}/api/bad_endpoint?k=v`,
				headers: {},
				body: {},
			};
			createRequestObjectStub = sandbox
				.stub()
				.returns(Object.assign({}, createRequestObjectResult));
			// eslint-disable-next-line no-underscore-dangle
			restoreCreateRequestObject = privateApi.__set__('createRequestObject', createRequestObjectStub);
			sendRequestPromiseResult = sendRequestPromise
				.call(LSK, defaultMethod, defaultEndpoint, options)
				.catch(result => result);
			return sendRequestPromiseResult;
		});

		afterEach(() => {
			restoreCreateRequestObject();
		});

		it('should create a request object', () => {
			(createRequestObjectStub.calledOn(LSK)).should.be.true();
			(createRequestObjectStub.calledWithExactly(defaultMethod, defaultEndpoint, options))
				.should.be.true();
		});

		it('should return the result of a popsicle request', () => {
			return sendRequestPromiseResult
				.then((result) => {
					(result).should.be.instanceof(PopsicleError);
				});
		});
	});

	describe('#handleTimestampIsInFutureFailures', () => {
		const { handleTimestampIsInFutureFailures } = privateApi;
		let result;
		let options;

		beforeEach(() => {
			result = {
				success: false,
				message: 'Timestamp is in the future',
			};
			options = {
				key1: 'value 1',
				key2: 2,
				timeOffset: 40,
			};
		});

		it('should resolve the result if success is true', () => {
			result.success = true;
			return handleTimestampIsInFutureFailures
				.call(LSK, defaultMethod, defaultEndpoint, options, result)
				.then((returnValue) => {
					(returnValue).should.equal(result);
				});
		});

		it('should resolve the result if there is no message', () => {
			delete result.message;
			return handleTimestampIsInFutureFailures
				.call(LSK, defaultMethod, defaultEndpoint, options, result)
				.then((returnValue) => {
					(returnValue).should.equal(result);
				});
		});

		it('should resolve the result if the message is not about the timestamp being in the future', () => {
			result.message = 'Timestamp is in the past';
			return handleTimestampIsInFutureFailures
				.call(LSK, defaultMethod, defaultEndpoint, options, result)
				.then((returnValue) => {
					(returnValue).should.equal(result);
				});
		});

		it('should resolve the result if the time offset is greater than 40 seconds', () => {
			options.timeOffset = 41;
			return handleTimestampIsInFutureFailures
				.call(LSK, defaultMethod, defaultEndpoint, options, result)
				.then((returnValue) => {
					(returnValue).should.equal(result);
				});
		});

		it('should resend the request with a time offset of 10 seconds if all those conditions are met and the time offset is not specified', () => {
			delete options.timeOffset;
			const expectedOptions = Object.assign({}, options, { timeOffset: 10 });
			return handleTimestampIsInFutureFailures
				.call(LSK, defaultMethod, defaultEndpoint, options, result)
				.then((returnValue) => {
					(returnValue).should.be.eql(sendRequestResult);
					(sendRequestStub.calledWithExactly(defaultMethod, defaultEndpoint, expectedOptions))
						.should.be.true();
				});
		});

		it('should resend the request with the time offset increased by 10 seconds if all those conditions are met and the time offset is specified', () => {
			const expectedOptions = Object.assign({}, options, { timeOffset: 50 });
			return handleTimestampIsInFutureFailures
				.call(LSK, defaultMethod, defaultEndpoint, options, result)
				.then((returnValue) => {
					(returnValue).should.be.eql(sendRequestResult);
					(sendRequestStub.calledWithExactly(defaultMethod, defaultEndpoint, expectedOptions))
						.should.be.true();
				});
		});
	});

	describe('#handleSendRequestFailures', () => {
		const { handleSendRequestFailures } = privateApi;

		let options;
		let error;
		let setNodeSpy;
		let banNodeSpy;
		let restoreBanNodeSpy;
		let checkReDialStub;
		let restoreCheckReDialStub;

		beforeEach(() => {
			options = {
				key1: 'value 1',
				key2: 2,
			};
			error = new Error('Test error.');
			setNodeSpy = sandbox.spy(LSK, 'setNode');
			banNodeSpy = sandbox.spy();
			// eslint-disable-next-line no-underscore-dangle
			restoreBanNodeSpy = privateApi.__set__('banNode', banNodeSpy);
		});

		afterEach(() => {
			restoreBanNodeSpy();
		});

		describe('if a redial is possible', () => {
			beforeEach(() => {
				checkReDialStub = sandbox.stub().returns(true);
				// eslint-disable-next-line no-underscore-dangle
				restoreCheckReDialStub = privateApi.__set__('checkReDial', checkReDialStub);
			});

			afterEach(() => {
				restoreCheckReDialStub();
			});

			it('should ban the node with options randomPeer true', () => {
				LSK.randomPeer = true;
				return handleSendRequestFailures.call(LSK, defaultMethod, defaultEndpoint, options, error)
					.then(() => {
						(banNodeSpy.calledOn(LSK)).should.be.true();
					});
			});

			it('should not ban the node with options randomPeer false', () => {
				LSK.randomPeer = false;
				return handleSendRequestFailures.call(LSK, defaultMethod, defaultEndpoint, options, error)
					.then(() => {
						(banNodeSpy.calledOn(LSK)).should.be.false();
					});
			});

			it('should set a new node', () => {
				return handleSendRequestFailures.call(LSK, defaultMethod, defaultEndpoint, options, error)
					.then(() => {
						(setNodeSpy.calledOnce).should.be.true();
					});
			});

			it('should send the request again with the same arguments', () => {
				return handleSendRequestFailures.call(LSK, defaultMethod, defaultEndpoint, options, error)
					.then(() => {
						(sendRequestStub.calledWithExactly(defaultMethod, defaultEndpoint, options))
							.should.be.true();
					});
			});

			it('should resolve to the result of the request', () => {
				return handleSendRequestFailures.call(LSK, defaultMethod, defaultEndpoint, options, error)
					.then((result) => {
						(result).should.be.eql(sendRequestResult);
					});
			});
		});

		describe('if no redial is possible', () => {
			beforeEach(() => {
				checkReDialStub = sandbox.stub(privateApi, 'checkReDial').returns(false);
			});

			it('should resolve to an object with success set to false', () => {
				return handleSendRequestFailures.call(LSK, defaultMethod, defaultEndpoint, options, error)
					.then((result) => {
						(result).should.have.property('success').and.be.equal(false);
					});
			});

			it('should resolve to an object with the provided error if no redial is possible', () => {
				return handleSendRequestFailures.call(LSK, defaultMethod, defaultEndpoint, options, error)
					.then((result) => {
						(result).should.have.property('error').and.be.equal(error);
					});
			});

			it('should resolve to an object with a helpful message', () => {
				return handleSendRequestFailures.call(LSK, defaultMethod, defaultEndpoint, options, error)
					.then((result) => {
						(result).should.have.property('message').and.be.equal('Could not create an HTTP request to any known peers.');
					});
			});
		});
	});
});
