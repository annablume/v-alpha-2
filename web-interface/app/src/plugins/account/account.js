const Account = ( function() { // eslint-disable-line no-unused-vars

  /**
   * V Plugin driving the transaction history / account display
   *
   */

  'use strict';

  /* ================== private methods ================= */

  async function castEntityName( address ) {
    const entity = await V.getEntity( address );
    return entity.success ? entity.data[0].fullId : V.castShortAddress( address );
  }

  async function presenter( path ) {
    // const pageState = V.getState( 'page' );
    const aE = V.getState( 'activeEntity' );

    if ( !aE ) {
      return;
    }

    // if ( true /* V.getState( 'active' ).path != '/me/account' /* pageState.height != pageState.topCalc */ ) {

    const $topcontent = AccountComponents.topcontent( aE.fullId );
    const $list = CanvasComponents.list( 'narrow' );

    const transactions = await V.getTransaction();

    if ( V.getSetting( 'transactionLedger' ) == 'EVM' ) {
      V.setNode( $list, [ InteractionComponents.onboardingCard() ] ); // TODO: should not have to be an Array here
    }

    if( !transactions.success || !transactions.data[0].length ) {
      V.setNode( $list, CanvasComponents.notFound( 'transactions' ) );

      const pageData = {
        topcontent: $topcontent,
        listings: $list,
        position: 'top',
        path: path
      };
      return pageData;
    }

    for ( const txData of transactions.data[0].reverse() ) {
      if ( V.getState( 'activeAddress' ) ) {

        const blockDetails = await window.Web3Obj.eth.getBlock( txData.block );
        txData.blockDate = blockDetails.timestamp;

        if ( txData.txType == 'in' ) {
          txData.title = await castEntityName( txData.fromAddress );
        }
        else if ( txData.txType == 'out' ) {
          txData.title = await castEntityName( txData.toAddress );
        }
      }
      if ( txData.txType == 'fee' ) {
        txData.title = 'Transaction Fee';
      }
      else if ( txData.txType == 'generated' ) {
        txData.title = 'Community Payout';
      }

      const $cardContent = AccountComponents.accountCard( txData );
      const $card = CanvasComponents.card( $cardContent );
      V.setNode( $list, $card );
    }

    // DemoContent.transactionsArr.forEach( cardData => {
    //   const $card = AccountComponents.accountCard( cardData );
    //   V.setNode( $list, $card );
    // } );

    // const $topsliderUl = AccountComponents.topSliderUl();
    // V.setNode( $topsliderUl, AccountComponents.accountBalance() );
    // for ( const variable in DemoContent.accountData ) {
    //   const $accountData = AccountComponents.accountSmallCard( variable, DemoContent.accountData );
    //   V.setNode( $topsliderUl, $accountData );
    // }

    const pageData = {
      // topslider: $topsliderUl,
      topcontent: $topcontent,
      listings: $list,
      // position: 'top',
      // path: path
    };

    return pageData;
    // }
  }

  function view( pageData ) {
    if ( pageData ) {
      Page.draw( pageData );
      Chat.drawMessageForm();
    }
    else {
      Marketplace.draw();
    }
  }

  function preview( path ) {
    const aE = V.getState( 'activeEntity' );
    const $list = CanvasComponents.list( 'narrow' );

    for ( let i = 0; i < 12; i++ ) {
      const $ph = AccountComponents.accountPlaceholderCard();
      const $card = CanvasComponents.card( $ph );

      V.setNode( $list, $card );
    }

    Button.draw( 'all', { fade: 'out' } );
    Navigation.draw( path );

    Page.draw( {
      topcontent: aE ? AccountComponents.topcontent( aE.fullId ) : '',
      listings: $list,
      position: 'top',
    } );
  }

  /* ============ public methods and exports ============ */

  function drawHeaderBalance( which ) {
    const aE = V.getState( 'activeEntity' );
    V.getEntityBalance( aE ).then( accState => {
      const balance = accState.data[0] ? accState.data[0][ which || 'liveBalance' ] : 'n/a';
      const $navBal = AccountComponents.headerBalance( balance );
      V.setNode( 'join', 'clear' );
      V.setNode( 'balance > svg', 'clear' );
      V.setNode( 'balance', $navBal );
      // setTimeout( () => {return V.setNode( 'balance', $navBal )}, 100 );
    } );
  }

  function draw( path ) {
    preview( path );
    presenter( path ).then( viewData => { view( viewData ) } );
  }

  return {
    draw: draw,
    drawHeaderBalance: drawHeaderBalance
  };

} )();
