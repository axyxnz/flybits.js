Flybits.util.Geo = (function(){
  var geo = {
    _toDeg : function(rad) {
      return rad * 180 / Math.PI;
    },
    _toRad : function(deg) {
      return deg * Math.PI / 180;
    },
    getBoundingBox: function(latLngArr){
      if(!latLngArr || latLngArr.length < 3){
        throw new Flybits.Validation().addError("Invalid Argument","Must provide an array of lat,lng coordinates greater than 2.",{
          code: Flybits.Validation.type.INVALIDARG
        });
      }
      var latMin = latLngArr[0].lat;
      var latMax = latLngArr[0].lat;
      var lngMin = latLngArr[0].lng;
      var lngMax = latLngArr[0].lng;

      for(var i = 1; i < latLngArr.length; i++){
        var pt = latLngArr[i];
        latMin = pt.lat < latMin? pt.lat:latMin;
        latMax = pt.lat > latMax? pt.lat:latMax;
        lngMin = pt.lng < lngMin? pt.lng:lngMin;
        lngMax = pt.lng > lngMax? pt.lng:lngMax;
      }

      return {
        min: {
          lat: latMin,
          lng: lngMin
        },
        max: {
          lat: latMax,
          lng: lngMax
        }
      };
    },
    getCenter: function(latLngArr){
      if(!latLngArr || latLngArr.length < 3){
        throw new Flybits.Validation().addError("Invalid Argument","Must provide an array of lat,lng coordinates greater than 2.",{
          code: Flybits.Validation.type.INVALIDARG
        });
      }
      var bounds = this.getBoundingBox(latLngArr);
      return {
        lat: (bounds.max.lat + bounds.min.lat) / 2,
        lng: (bounds.max.lng + bounds.min.lng) / 2
      };
    },
    getBearing: function(pt1,pt2){
      var dLng = (pt2.lng-pt1.lng);
      var y = Math.sin(dLng) * Math.cos(pt2.lat);
      var x = Math.cos(pt1.lat)*Math.sin(pt2.lat) - Math.sin(pt1.lat)*Math.cos(pt2.lat)*Math.cos(dLng);
      var brng = this._toDeg(Math.atan2(y, x));
      return 360 - ((brng + 360) % 360);
    }
  };

  return geo;
})();
