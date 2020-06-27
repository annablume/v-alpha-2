const VEvm = ( function() { // eslint-disable-line no-unused-vars

  /**
   * V Core Module to access EVM-compatible ledgers
   *
   */

  'use strict';

  let contract;

  const subscribedEvents = {};

  const burnAddress = '0x0000000000000000000000000000000000000000';

  /* ================== event handlers ================== */

  function setNewActiveAddress() {

    var currentActiveAddress = window.Web3Obj.currentProvider.publicConfigStore._state.selectedAddress;
    // console.log( currentActiveAddress );
    // console.log( V.getState( 'activeAddress' ) );

    if ( currentActiveAddress == null ) {
      V.setState( 'activeEntity', 'clear' );
      V.setState( 'activeAddress', 'clear' );
      V.setCookie( 'last-active-address', 'clear' );
      V.setCookie( 'last-active-uphrase', 'clear' );
      V.setCookie( 'welcome-modal', 1 );
      Join.draw( 'logged out' );
    }
    else if ( currentActiveAddress != V.getState( 'activeAddress' ) ) {
      V.setCookie( 'welcome-modal', 1 );
      V.setState( 'activeEntity', 'clear' );
      V.setState( 'activeAddress', currentActiveAddress.toLowerCase() );
      Join.draw( 'new entity was set up' );
    }

  }

  /* ================== private methods ================= */

  function castEthBalance( balance ) {
    return Number( balance / 10**18 ).toFixed( 1 );
  }

  function castTokenFloat( balance ) {
    const divisibility = V.getState( 'contract' ).divisibility;
    return Number( balance / 10**( divisibility ) ).toFixed( 0 );
  }

  async function castEntityName( address ) {
    const entity = await V.getEntity( address );
    return entity.success ? entity.data[0].fullId : V.castShortAddress( address );
  }

  async function castTransfers( transfers, which ) {
    const filteredAndEnhanced = await transfers.filter( tx => {
      const data = tx.returnValues;
      return data.from.toLowerCase() == which ||
            data.to.toLowerCase() == which;

    } ).map( async tx => {
      const txData = {};

      txData.fromAddress = tx.returnValues.from.toLowerCase();
      txData.toAddress = tx.returnValues.to.toLowerCase();

      txData.fromAddress == which ? txData.txType = 'out' : null;
      txData.toAddress == which ? txData.txType = 'in' : null;
      txData.toAddress == burnAddress ? txData.txType = 'fee' : null;
      txData.fromAddress == burnAddress ? txData.txType = 'generated' : null;

      txData.amount = castTokenFloat( tx.returnValues.value );

      txData.feesBurned = castTokenFloat( tx.returnValues.feesBurned || 0 );
      txData.contribution = castTokenFloat( tx.returnValues.contribution || 0 );

      txData.payout = txData.fromAddress == which
        ? castTokenFloat( tx.returnValues.payoutSender || 0 )
        : castTokenFloat( tx.returnValues.payoutRecipient || 0 );

      txData.message = 'n/a';

      txData.hash = tx.transactionHash;
      txData.logIndex = tx.logIndex;
      txData.block = tx.blockNumber;

      const blockDetails = await window.Web3Obj.eth.getBlock( txData.block );
      txData.blockDate = blockDetails.timestamp;

      txData.fromEntity = await castEntityName( txData.fromAddress );
      txData.toEntity = await castEntityName( txData.toAddress );

      if ( txData.txType == 'in' ) {
        txData.title = txData.fromEntity;
      }
      else if ( txData.txType == 'out' ) {
        txData.title = txData.toEntity;
      }
      else if ( txData.txType == 'fee' ) {
        txData.title = 'Transaction Fee';
      }
      else if ( txData.txType == 'generated' ) {
        txData.title = 'Community Payout';
      }

      return txData;

    } );

    return Promise.all( filteredAndEnhanced );
  }

  async function handleTransferSummaryEvent( eventData ) {
    const aA = V.getState( 'activeAddress' );
    if ( aA && ( eventData.to.toLowerCase() == aA || eventData.from.toLowerCase() == aA ) ) {
      Account.drawHeaderBalance();
      if ( V.getState( 'active' ).navItem == '/me/transfers' ) {
        const filteredAndEnhanced = await castTransfers( [ { returnValues: eventData } ], aA );

        // if ( tx.txType == 'in' ) {
        //   tx.title = await castEntityName( tx.fromAddress );
        // }
        // else if ( tx.txType == 'out' ) {
        //   tx.title = await castEntityName( tx.toAddress );
        // }

        const $cardContent = AccountComponents.accountCard( filteredAndEnhanced[0] );
        const $card = CanvasComponents.card( $cardContent );

        const $ph = V.getNode( '.placeholder' );
        $ph ? V.setNode(  $ph.closest( 'li' ), 'clear' ) : null;
        V.setNode( 'list', $card, 'prepend' );
      }
    }
  }

  /* ================== public methods  ================= */

  function getWeb3Provider() {
    let provider;
    if ( window.ethereum ) {
      // Modern dapp browsers
      // console.log( 'ethereum is there' );
      provider = window.ethereum;
    }
    else if ( window.web3 ) {
      // Legacy dapp browsers
      // console.log( 'web3 is there' );
      // provider = window.web3.currentProvider;
      return {
        success: false,
        status: 'web3 provider outdated',
      };
    }
    else {
      // If no injected web3 instance is detected, fall back to Truffel/Ganache
      // console.log( 'local network is there' );
      // provider = new Web3.providers.HttpProvider( 'http://localhost:9545' );
      return {
        success: false,
        status: 'web3 provider not found',
      };
    }

    window.Web3Obj = new Web3( provider );
    contract = new window.Web3Obj.eth.Contract( VEvmAbi, V.getNetwork().contractAddress );

    V.getContractState().then( res => {
      // if ( res.succcess ) {
      V.setState( 'contract', res.data ? res.data[0] : {} );
      // }
    } );

    return {
      success: true,
      status: 'provider set',
    };

  }

  async function setActiveAddress() {

    if ( window.ethereum && !window.ethereum.selectedAddress ) {

      Join.draw( 'wallet locked' );

      try {
        // Request account access
        await window.ethereum.enable();
      }
      catch ( error ) {
        // User denied account access...
        return {
          success: false,
          status: 'user denied auth',
        };
      }
    }

    if ( window.Web3Obj ) {

      const activeAddress = await window.Web3Obj.eth.getAccounts();
      // const activeAddress = window.Web3Obj.currentProvider.publicConfigStore._state.selectedAddress;
      V.setState( 'activeAddress', activeAddress[0] ? activeAddress[0].toLowerCase() : false );

      /* listen to change of address in MetaMask */
      if ( window.Web3Obj.currentProvider.publicConfigStore ) {
        window.Web3Obj.currentProvider.publicConfigStore.on( 'update', setNewActiveAddress );
      }

      setEventSubscription( 'TransferSummary' );

      return {
        success: true,
        status: 'address set',
      };
    }
    else {
      return {
        success: false,
        status: 'Web3Obj not available',
      };
    }

  }

  async function getContractState() {
    if ( contract ) {

      const blockNumber = contract.methods.getBlockNumber().call();
      const fee = contract.methods.transactionFee.call().call();
      const contribution = contract.methods.communityContribution.call().call();
      const divisibility = contract.methods.decimals.call().call();

      const allEvents = contract.getPastEvents( 'allEvents', {
      // filter: {myIndexedParam: [20,23], myOtherIndexedParam: '0x123456789...'},
        fromBlock: 0,
        toBlock: 'latest'
      }, ( error ) => {return error ? console.error( error ) : null} )
        .then( res => {
          return res.map( item => {
            return {
              b: item.blockNumber,
              e: item.event,
              val: item.returnValues.value/( 10**6 ),
              to: item.returnValues.to,
              from: item.returnValues.from,
              all: item
            };
          } ).reverse();
        } );

      const all = await Promise.all( [ blockNumber, fee, contribution, divisibility, allEvents ] )
        .catch( err => { return err } );

      if ( all && all[0] ) {

        console.log( '*** CONTRACT STATE ***' );
        console.log( 'Current Block: ', all[0] );
        // console.log( 'Fee: ', ( all[1] / 100 ).toFixed( 2 ) );
        // console.log( 'Contribution: ', ( all[2] / 100 ).toFixed( 2 ) );
        // console.log( 'Divisibility: ', all[3] );
        // console.log( 'Contract: ', contract._address );
        // console.log( 'Network: ', V.getNetwork() );
        // console.log( 'All Events:', all[4] );
        console.log( '*** CONTRACT STATE END ***' );

        const data = {
          currentBlock: Number( all[0] ),
          fee: all[1],
          contribution: all[2],
          divisibility: all[3],
          contract: contract._address,
          network: V.getNetwork(),
          allEvents: all[4],
        };

        return {
          success: true,
          status: 'contract state retrieved',
          data: [ data ]
        };
      }
      else {

        console.warn( 'Could not get contract state' );

        return {
          success: false,
          status: 'contract state not retrieved',
          message: all
        };
      }
    }
    else {
      return {
        success: false,
        status: 'contract state not retrieved',
      };
    }
  }

  async function getAddressState( which ) {

    const all = await Promise.all( [
      window.Web3Obj.eth.getBalance( which ),
      contract.methods.liveBalanceOf( which ).call(),
      contract.methods.getDetails( which ).call()
    ] ).catch( err => {
      console.warn( 'Could not get address state' );
      return err;
    } );

    if ( all && all[0] && all[1] && all[2] ) {
      return {
        success: true,
        status: 'address state retrieved',
        ledger: 'EVM',
        data: [{
          coinBalance: castEthBalance( all[0] ),
          liveBalance: castTokenFloat( all[1] ),
          tokenBalance: castTokenFloat( all[2]._balance ),
          lastBlock: all[2]._lastBlock,
          zeroBlock: all[2]._zeroBlock,
        }]
      };
    }
    else {
      return {
        success: false,
        status: 'could not retrieve address state',
        message: all,
        ledger: 'EVM'
      };
    }

  }

  async function getAddressHistory(
    which = V.getState( 'activeAddress' ),
    data = { fromBlock: 0, toBlock: 'latest' },
    whichEvent = 'TransferSummary'
  ) {

    const transfers = await contract.getPastEvents( whichEvent, {
      // filter: {myIndexedParam: [20,23], myOtherIndexedParam: '0x123456789...'},
      fromBlock: data.fromBlock,
      toBlock: data.toBlock
    }, ( error ) => {
      error ? console.error( error ) : null;
    } )
      .then( ( events ) => {
        return events;
      } );

    if ( !transfers.length ) {
      return {
        success: false,
        status: 'no transfers',
        ledger: 'EVM',
      };
    }

    const filteredAndEnhanced = await castTransfers( transfers, which );

    return {
      success: true,
      status: 'transactions retrieved',
      ledger: 'EVM',
      data: filteredAndEnhanced
    };

  }

  function setAddressVerification( which ) {
    console.log( 'verify:', which );
    return contract.methods.verifyAccount( which ).send( { from: V.getState( 'activeAddress' ), gas: 6001000 } )
      .on( 'transactionHash', ( hash ) => {
        console.log( 'Hash: ', hash );
        // contract.methods.accountApproved( ethAddress ).call( ( err, result ) => {
        //   console.log( 'accountApproved result (confirm):', result, ' error: ', err );
        // } );
      } )
      .on( 'error', function( error ) { console.log( 'Error: ' + error ) } )
      .then( function( receipt ) {
        console.log( 'Success: ' + JSON.stringify( receipt ) );

        return {
          success: true,
          status: 'account verified',
        };

      } );
  }

  function setCoinTransaction( data ) {

    const txObject = {
      from: data.initiatorAddress,
      to: data.recipientAddress,
      value: window.Web3Obj.utils.toWei( data.txTotal.toString(), 'ether' ),
      // "gas": 21000,         (optional)
      // "gasPrice": 4500000,  (optional)
      // "data": 'For testing' (optional)
      // "nonce": 10           (optional)
    };

    return window.Web3Obj.eth.sendTransaction( txObject )
      .once( 'transactionHash', function( hash ) {
        console.log( 'Hash: ' + hash );
        Modal.draw( 'transaction sent' );
      } )
      .once( 'receipt', function( receipt ) { console.log( 'Receipt A: ' + JSON.stringify( receipt ) ) } )
      .on( 'confirmation', function( confNumber, receipt ) {
        console.log( 'Confirmation Number: ' + JSON.stringify( confNumber ) );
        console.log( 'Receipt B: ' + JSON.stringify( receipt ) );
      } )
      .on( 'error', function( error ) { console.log( 'Error: ' + error ) } )
      .then( function( receipt ) {
        console.log( 'Success: ' + JSON.stringify( receipt ) );

        return {
          success: true,
          status: 'last eth transaction successful',
          data: [ receipt ]

        };

      } );

  }

  async function setTokenTransaction( data ) {
    const recipient = window.Web3Obj.utils.toChecksumAddress( data.recipientAddress );
    const sender = data.initiatorAddress;
    const amount = data.txTotal * 10**6;
    const txFunction = await new Promise( ( resolve, reject ) => {
      return contract.methods.transfer( recipient, amount ).send( { from: sender } )
        .once( 'transactionHash', function( hash ) {
          console.log( 'Transaction Hash: ' + hash );
          Modal.draw( 'transaction sent' );
        } )
        // .once( 'receipt', function( receipt ) { console.log( 'Receipt A: ' + JSON.stringify( receipt ) ) } )
        // .on( 'confirmation', function( confNumber, receipt ) {
        //   console.log( 'Confirmation Number: ' + JSON.stringify( confNumber ) );
        //   console.log( 'Receipt B: ' + JSON.stringify( receipt ) );
        // } )
        .on( 'error', function( error ) {
          console.log( 'Transaction Error: ' + JSON.stringify( error ) );

          reject( {
            success: false,
            status: error.code,
            message: error.message,
            data: []
          } );

        } )
        .then( function( receipt ) {
          console.log( 'Transaction Success' /* + JSON.stringify( receipt ) */ );

          resolve( {
            success: true,
            status: 'last token transaction successful',
            data: [ receipt ]
          } );

        } );
    } );

    return txFunction;
  }

  function setEventSubscription( whichEvent ) {
    // https://medium.com/coinmonks/how-to-subscribe-smart-contract-events-using-web3-1-0-93e996c06af2
    const eventJsonInterface = window.Web3Obj.utils._.find( contract._jsonInterface, o => { return o.name === whichEvent && o.type === 'event' } );
    const subscription = window.Web3Obj.eth.subscribe( 'logs', {
      address: contract.options.address,
      topics: [eventJsonInterface.signature]  },
    ( error, result ) => {
      if ( !error ) {
        const eventData = window.Web3Obj.eth.abi.decodeLog( eventJsonInterface.inputs, result.data, result.topics.slice( 1 ) );
        if ( whichEvent == 'TransferSummary' ) {
          handleTransferSummaryEvent( eventData );
        }
      }
    } );

    subscribedEvents[whichEvent] = subscription;
  }

  /* ====================== export  ===================== */

  ( () => {
    V.getWeb3Provider = getWeb3Provider;
    V.setActiveAddress = setActiveAddress;
    V.getContractState = getContractState;
    V.getAddressState = getAddressState;
    V.getAddressHistory = getAddressHistory;
    V.setAddressVerification = setAddressVerification;
    V.setCoinTransaction = setCoinTransaction;
    V.setTokenTransaction = setTokenTransaction;
  } )();

  return {
    setActiveAddress: setActiveAddress,
    getContractState: getContractState,
    getAddressState: getAddressState,
    getAddressHistory: getAddressHistory,
    setAddressVerification: setAddressVerification,
    setCoinTransaction: setCoinTransaction,
    setTokenTransaction: setTokenTransaction,
  };

} )();
