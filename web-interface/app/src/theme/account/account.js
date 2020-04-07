const Account = ( function() { // eslint-disable-line no-unused-vars

  /**
  * Module driving the transaction history / account display
  *
  *
  */

  'use strict';

  /* ================== private methods ================= */

  async function castEntityName( address ) {
    const entity = await V.getEntity( address );
    return entity.data[0] ? entity.data[0].fullId : V.castShortAddress( address );
  }

  async function presenter() {
    const pageState = V.getState( 'page' );

    if ( pageState.height != pageState.topCalc ) {
      const transactions = await V.getTransaction( V.getState( 'activeEntity' ).fullId );
      const $listingsUl = AccountComponents.listingsUl();

      for ( const txData of transactions.data[0].reverse() ) {
        if ( V.getSetting( 'transactionLedger' ) != 'MongoDB' ) {
          if ( txData.txType == 'in' ) {
            txData.title = await castEntityName( txData.fromAddress );
          }
          else if ( txData.txType == 'out' ) {
            txData.title = await castEntityName( txData.toAddress );
          }
        }
        if ( txData.txType == 'burned' ) {
          txData.title = 'Burn Account';
        }
        else if ( txData.txType == 'generated' ) {
          txData.title = 'Community Payout';
        }

        const $card = AccountComponents.accountCard( txData );
        V.setNode( $listingsUl, $card );
      }

      // DemoContent.transactionsArr.forEach( cardData => {
      //   const $card = AccountComponents.accountCard( cardData );
      //   V.setNode( $listingsUl, $card );
      // } );

      // const $topsliderUl = AccountComponents.topSliderUl();
      // V.setNode( $topsliderUl, AccountComponents.accountBalance() );
      // for ( const variable in DemoContent.accountData ) {
      //   const $accountData = AccountComponents.accountSmallCard( variable, DemoContent.accountData );
      //   V.setNode( $topsliderUl, $accountData );
      // }

      const pageData = {
      // topslider: $topsliderUl,
        topcontent: V.cN( {
          tag: 'p',
          class: 'pxy fs-xl font-bold txt-center',
          html: 'Account of ' + V.getState( 'activeEntity' ).fullId,
        } ),
        listings: $listingsUl,
        position: 'top'
      };

      return pageData;
    }
    else {
      return null;
    }

  }

  function view( pageData ) {
    if ( pageData ) {
      Navigation.draw( 'all', { reset: true } );
      Page.draw( pageData );
    }
    else {
      Marketplace.draw();
    }
  }

  /* ============ public methods and exports ============ */

  function drawHeaderBalance( which ) {
    V.getActiveEntityData().then( accState => {
      const balance = accState.data[0] ? accState.data[0][ which || 'liveBalance' ] : 'n/a';
      const $navBal = AccountComponents.headerBalance( balance );
      V.setNode( 'join', 'clear' );
      V.setNode( 'balance > svg', 'clear' );
      setTimeout( () => {return V.setNode( 'balance', $navBal )}, 700 );
    } );
  }

  function draw( options ) {
    presenter( options ).then( viewData => { view( viewData ) } );
  }

  return {
    draw: draw,
    drawHeaderBalance: drawHeaderBalance
  };

} )();
