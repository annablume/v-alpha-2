const VEntity = ( function() { // eslint-disable-line no-unused-vars

  // TODO:
  // what if dice cant find a free number? better pick from list?
  // location

  /**
   * V Entity
   *
   */

  'use strict';

  const entitySetup = {
    capWordLength: 7,  // a cap on the number of words in an entity name that the system can handle
    maxEntityWords: 7,  // max allowed words in entity names (not humans) // MUST be less or equal to capWordLength
    maxHumanWords: 3,  // max allowed words in human entity names // MUST be less or equal to capWordLength
    maxWordLength: 12,  // max allowed length of each word in name
  };

  /* ================== private methods ================= */

  async function castEntity( entityData ) {

    if ( entityData.location && !entityData.lat ) {
      return {
        success: false,
        status: 'could not attach geo data'
      };
    }

    // check whether we have a valid title
    const title = castEntityTitle( entityData.title, entityData.role );

    if ( !title.success ) {
      return {
        success: false,
        status: 'invalid title'
      };
    }

    // cast tag and fullId
    const tag = castTag();
    const fullId = title.data[0] + ' ' + tag;
    const slug = V.castSlugOrId( fullId );
    const path = '/profile/' + slug;

    // check whether this title and tag combination exists, otherwise start again
    const exists = await getEntity( fullId );

    if ( exists.success ) { // success is not a good thing here ;)
      console.log( 'entity already exists:', exists.data[0].fullId );
      castEntity( entityData );
      // return {
      //   success: false,
      //   status: 'entity exists'
      // };
    }

    const activeEntity = V.getState( 'activeEntity' );
    const activeAddress = V.getState( 'activeAddress' ) ? V.getState( 'activeAddress' ) : 'none';

    const d = new Date();
    const date = d.toString();
    const unix = Date.now();

    let geometry, uPhrase, creator, creatorTag;

    if ( entityData.location && entityData.lat ) {
      geometry = {
        type: 'Point',
        coordinates: [entityData.lng, entityData.lat],
      };
    }
    else {
      geometry = {
        type: 'Point',
        coordinates: [( Math.random() * ( 54 - 32 + 1 ) + 32 ).toFixed( 5 ) * -1, ( Math.random() * ( 35 - 25 + 1 ) + 25 ).toFixed( 5 )],
      };
    }

    if ( entityData.uPhrase ) {
      uPhrase = entityData.uPhrase;
    }
    else if ( socket ) {
      uPhrase = 'vx' + socket.id.replace( /_/g, 'a' ).replace( /-/g, '2' ).slice( 0, 16 );
    }
    else {
      uPhrase = 'none';
    }

    if ( activeEntity ) {
      creator = activeEntity.profile.title;
      creatorTag = activeEntity.profile.tag;
    }
    else {
      creator = title.data[0];
      creatorTag = tag;
    }

    const newEntity = {
      fullId: fullId,
      path: path,
      activeAddress: activeAddress,
      uPhrase: uPhrase,
      profile: {
        fullId: fullId,
        slug: slug,
        path: path,
        title: title.data[0],
        tag: tag,
        role: entityData.role ? entityData.role : 'network',
        status: 'active',
        verified: false,
        joined: {
          date: date,
          unix: unix,
          // block: all[1].success ? all[1].data[0].currentBlock : 0,
        },
        creator: creator,
        creatorTag: creatorTag,
      },
      evmCredentials: {
        address: entityData.evmAddress ? entityData.evmAddress : 'none'
      },
      symbolCredentials: entityData.symbolCredentials || { address: 'none' },
      owners: [{
        ownerName: creator,
        ownerTag: creatorTag,
      }],
      admins: [{
        adminName: creator,
        adminTag: creatorTag,
      }],
      properties: {
        location: entityData.location || 'no location given',
        description: entityData.description || 'no description given',
        target: entityData.target || 'none',
        unit: entityData.unit || 'none',
        creator: creator,
        creatorTag: creatorTag,
      },
      geometry: geometry,
    };

    return {
      success: true,
      status: 'cast entity',
      data: [ newEntity ]
    };
  }

  function castTag() {

    // for demo content creation
    if ( V.getSetting( 'demoContent' ) ) {
      return '#2121';
    }

    let continueDice = true;

    while ( continueDice ) { // 334 combinations in the format of #5626
      const number1 = String( Math.floor( Math.random() * ( 9 - 2 + 1 ) ) + 2 );
      const number2 = String( Math.floor( Math.random() * ( 9 - 1 + 1 ) ) + 1 );
      const number3 = String( Math.floor( Math.random() * ( 9 - 2 + 1 ) ) + 2 );

      if (
        number2 != number1 &&
        number3 != number1 &&
        number3 != number2 &&
        [number1, number2, number3].indexOf( '7' ) == -1 && // has two syllables
        [number1, number2, number3].indexOf( '4' ) == -1 && // stands for death in asian countries
        number1 + number2 != '69' && // sexual reference
        number3 + number2 != '69' &&
        number1 + number2 != '13' && // bad luck in Germany
        number3 + number2 != '13' &&
        number1 + number2 != '21' && // special VI tag
        number3 + number2 != '21'
      ) {
        continueDice = false;
        return '#' + number1 + number2 + number3 + number2;
      }
    }
  }

  /* ============ public methods and exports ============ */

  function castEntityTitle( title, role ) {

    var checkLength = title.split( ' ' ).length;
    var wordLengthExeeded = title.split( ' ' ).map( item => { return item.length > entitySetup.maxWordLength } );

    if (
      ['vx', 'Vx', '0x'].includes( title.substring( 0, 2 ) ) ||
         // ( systemInit.communityGovernance.excludeNames.includes( tools.constructUserName( title ) ) && !( entityData.firstRegistration ) ) ||
         title.length > 200 ||
         title.length < 2 ||
         title.indexOf( '#' ) != -1 ||
         title.indexOf( '2121' ) != -1 ||
         // title.replace( /[0-9]/g, '' ).length < title.length ||
         checkLength > entitySetup.capWordLength ||
         ( ['member', 'network'].includes( role ) && checkLength > entitySetup.maxHumanWords ) ||
         ( ['member', 'network'].indexOf( role ) == -1 && checkLength > entitySetup.maxEntityWords ) ||
         wordLengthExeeded.includes( true )
    ) {
      return {
        success: false,
        status: 'invalid title'
      };
    }
    else {

      const titleArray = title.trim().toLowerCase().split( ' ' );

      const formattedTitle = titleArray.map( function( string ) {
        if ( string.length > 2 && string.substr( 0, 2 ) == 'mc' ) {
          return string.charAt( 0 ).toUpperCase() + string.slice( 1, 2 ) + string.charAt( 2 ).toUpperCase() + string.slice( 3 );
        }
        if ( string.length > 3 && string.substr( 0, 3 ) == 'mac' ) {
          return string.charAt( 0 ).toUpperCase() + string.slice( 1, 3 ) + string.charAt( 3 ).toUpperCase() + string.slice( 4 );
        }
        else {
          return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
        }
      } ).join( ' ' );

      return {
        success: true,
        status: 'cast entity title',
        data: [ formattedTitle ]
      };
    }
  }

  async function getEntityBalance( entity ) {

    const tL = V.getSetting( 'transactionLedger' );

    if ( ['EVM', 'Symbol'].includes( tL ) ) {

      const bal = await V.getAddressState( entity[tL.toLowerCase() + 'Credentials']['address'] );

      if ( bal.success ) {
        return  {
          success: true,
          status: 'entity balance retrieved',
          ledger: tL,
          data: [
            {
              coinBalance: bal.data[0].coinBalance,
              tokenBalance: bal.data[0].tokenBalance,
              liveBalance: bal.data[0].liveBalance,
              lastBlock: bal.data[0].lastBlock,
              zeroBlock: bal.data[0].zeroBlock
            }
          ]
        };
      }
      else {
        return  {
          success: false,
          status: 'could not retrieve entity balance',
          ledger: tL,
          data: []
        };
      }
    }
    else if ( tL == 'MongoDB' ) {
      const bal = await getEntity( entity.fullId );

      if ( bal.success ) {
        return  {
          success: true,
          status: 'entity balance retrieved',
          ledger: tL,
          data: [
            {
              tokenBalance: bal.data[0].onChain.balance,
              liveBalance: bal.data[0].onChain.balance, // TODO: this is the wrong live balance
              lastBlock: bal.data[0].onChain.lastMove,
            }
          ]
        };
      }
      else {
        return  {
          success: false,
          status: 'could not retrieve entity balance',
          ledger: tL,
          data: []
        };
      }
    }
  }

  function getEntity(
    // defaults to searching all entities (via all roles)
    which = 'all',
    filter = 'role'
  ) {

    const whichLedger = V.getSetting( 'entityLedger' );

    if ( whichLedger == 'MongoDB' ) {
      if ( which.substr( 0, 2 ) == '0x' ) {
        filter = 'evmAddress';
      }
      if (
        which.substr( 0, 1 ) == 'T' &&
        which.length == 40
      ) {
        filter = 'symbolAddress';
      }
      else if ( which.substr( 0, 2 ) == 'vx' ) {
        filter = 'uPhrase';
      }
      else if ( new RegExp( /#\d{4}/ ).test( which ) ) {
        filter = 'fullId';
      }
    }
    else if ( whichLedger == '3Box' ) {

      // TODO: this currently only requests a single entity if address is given
      // and returns false otherwise in order to allow castEntity to run successfully

      if ( which.substr( 0, 2 ) == '0x' ) {
        // TODO: filter = 'evmAddress';
      }
      else {
        return Promise.resolve( {
          success: false,
          status: 'return false for testing',
        } );
      }
    }

    return V.getData( which, 'entity by ' + filter, whichLedger );
  }

  async function setEntity( entityData, options = 'entity' ) {

    if ( V.getSetting( 'transactionLedger' ) == 'Symbol' ) {
      const newSymbolAddress = await V.setActiveAddress();
      entityData.symbolCredentials ? null : entityData.symbolCredentials = newSymbolAddress.data[0];
    }
    if ( options == 'verification' ) {
      return V.setData( entityData, options, V.getSetting( 'transactionLedger' ) );
    }
    else {

      const entityCast = await castEntity( entityData );

      if ( entityCast.success ) {
        return V.setData( entityCast.data[0], options, V.getSetting( 'entityLedger' ) );
      }
      else {
        return Promise.resolve( entityCast );
      }
    }
  }

  return {
    castEntityTitle: castEntityTitle,
    getEntity: getEntity,
    setEntity: setEntity,
    getEntityBalance: getEntityBalance
  };

} )();
