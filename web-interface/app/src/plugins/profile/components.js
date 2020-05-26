const ProfileComponents = ( function() { // eslint-disable-line no-unused-vars

  /**
   * Components for V Profile Plugin
   *
   */

  'use strict';

  function topcontent( fullId ) {
    return V.sN( {
      t: 'h1',
      c: 'font-bold fs-l leading-snug txt-center w-screen pxy',
      h: `Entity Profile<br>${ fullId }`
    } );
  }

  function locationCard( entity ) {
    return V.castNode( {
      tag: 'div',
      c: 'contents',
      html: `${entity.properties.location}`
    } );
  }

  return {
    topcontent: topcontent,
    locationCard: locationCard,
  };

} )();
