const AccountComponents = ( function() { // eslint-disable-line no-unused-vars

  /**
   * Components for V Account Plugin
   *
   */

  'use strict';

  const
    strFrom  = 'from',
    strTo    = 'to',
    strBlock = 'block',
    strDate  = 'date';

  function str( string, scope ) {
    return V.i18n( string, 'account components', scope || 'transaction details' ) + ' ';
  }

  function handleDrawUserNav() {
    if ( V.getVisibility( 'user-nav' ) ) {
      V.setState( 'active', { navItem: false } );
      Chat.drawMessageForm( 'clear' );
      Marketplace.draw();
    }
    else {
      Button.draw( 'all', { fade: 'out' } );
      V.setAnimation( 'entity-nav', 'fadeOut', { duration: 0.1 } );
      V.setAnimation( 'service-nav', 'fadeOut', { duration: 0.6 } );
      V.setAnimation( 'user-nav', 'fadeIn', { duration: 0.2 } );
    }
  }

  function topcontent( fullId ) {
    return V.cN( {
      t: 'div',
      h: V.cN( {
        tag: 'h1',
        class: 'font-bold txt-center pxy',
        html: fullId
      } )

    } );
  }

  function headerBalance( balance ) {
    const sc = V.getState( 'screen' );

    return V.castNode( {
      tag: 'svg',
      a: {
        width: sc.width > 800 ? '66px' : '54px',
        viewBox: '0 0 36 36'
      },
      html: `<circle stroke-dasharray="100" transform ="rotate(-90, 18, 18) translate(0, 36) scale(1, -1)" stroke-dashoffset="-200" cx="18" cy="18" r="15.91549430918954" fill="white" stroke="#1b1aff" stroke-width="2.7"></circle>
              <text class="font-medium fs-xxs txt-green" x="50%" y="59%">${ balance }</text>`,
      click: handleDrawUserNav

    } );
  }

  function accountBalance() {
    return V.castNode( {
      tag: 'li',
      class: 'txt-anchor-mid',
      html: `<svg width="74px" viewBox="0 0 36 36"> +
              <circle stroke-dasharray="100" transform ="rotate(-90, 18, 18) translate(0, 36) scale(1, -1)" stroke-dashoffset="-200" cx="18" cy="18" r="15.91549430918954" fill="white" stroke="#1b1aff" stroke-width="2.7"></circle>
              <text class="font-medium fs-xxs txt-green" x="50%" y="59%">3129</text>
            </svg>`

    } );
  }

  function accountSmallCard( variable, accountData ) {
    return V.castNode( {
      tag: 'li',
      classes: 'pxy txt-center',
      html: `<div class="smallcard__container font-medium pxy">
              <p class="font-medium pb-xs">${variable}</p>
              <div class="flex justify-center items-center circle-2 rounded-full border-shadow font-medium no-txt-select">
                ${accountData[variable]}
              </div>
            </div>`
    } );
  }

  function accountCard( txData ) {

    let background = '';

    switch ( txData.txType ) {
    case 'in':
      background = '#B4ECB4';
      break;
    case 'out':
      background = '#FFAACC';
      break;
    case 'fee':
      background = 'lightblue';
      break;
    case 'generated':
      background = 'green';
      break;
    default:
      background = 'gray';
    }

    const $cardContentFrame = V.cN( {
      t: 'div',
      c: 'contents'
    } );

    const $topLeft = V.cN( {
      t: 'div',
      c: 'card__top-left flex justify-center items-center pxy',
      h: {
        t: 'div',
        c: 'circle-3 flex justify-center items-center rounded-full cursor-pointer',
        a: {
          style: `background:${background}`
        },
        h: {
          t: 'div',
          c: 'card__initials font-medium fs-xl txt-white',
          h: txData.amount
        }
      }
    } );

    const $topRight = V.cN( {
      t: 'div',
      c: 'card__top-right flex items-center pxy',
      h: {
        t: 'h2',
        c: 'font-bold fs-l leading-snug cursor-pointer',
        h: txData.title
      }
    } );

    const $bottomLeft = V.cN( {
      t: 'div',
      c: 'card__bottom-left items-center pxy',
      h: ''
    } );

    const $bottomRight = V.cN( {
      t: 'div',
      c: 'card__bottom-right pxy',
      h: [
        txData.fromAddress != 'none' ? { t: 'p', h: str( strFrom ) + txData.fromAddress } : { t: 'p', h: str( strFrom ) + txData.from + ' ' + txData.fromTag },
        txData.toAddress != 'none' ? { t: 'p', h: str( strTo ) + txData.toAddress } : { t: 'p', h: str( strTo ) + txData.to + ' ' + txData.toTag },
        txData.block ? { t: 'p', h: str( strBlock ) + txData.block } : { t: 'p', h: str( strDate ) + txData.date },
      ]
    } );

    V.setNode( $cardContentFrame, [ $topLeft, $topRight, $bottomLeft, $bottomRight ] );

    return $cardContentFrame;

  }

  return {
    topcontent: topcontent,
    headerBalance: headerBalance,
    accountBalance: accountBalance,
    accountSmallCard: accountSmallCard,
    accountCard: accountCard,
  };

} )();
