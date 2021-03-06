Flybits.util.Api = (function(){
  var api = {
    checkResult: function(resp){
      if(resp.status >= 200 && resp.status < 300){
        return resp;
      }
      throw resp;
    },
    getResultStr: function(resp){
      return resp && resp.text?resp.text():new Promise(function(resolve,reject){
        resolve("");
      });
    },
    getResultJSON: function(resp){
      return resp.json();
    },
    toURLParams: function(obj){
      var keys = Object.keys(obj);
      var keyLength = keys.length;
      var str = "";
      while(keyLength--){
        var key = keys[keyLength];
        if(str !== ""){
          str += "&";
        }
        str += key + "=" + encodeURIComponent(obj[key]);
      }

      return str;
    },
    htmlEncode:function(value){
      /*global encodeURIComponent*/
      return encodeURIComponent(value);
    },
    htmlDecode:function(str){
      return str.replace(/&#?(\w+);/g, function(match, dec) {
        if(isNaN(dec)) {
          chars = {quot: 34, amp: 38, lt: 60, gt: 62, nbsp: 160, copy: 169, reg: 174, deg: 176, frasl: 47, trade: 8482, euro: 8364, Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197, AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203, Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208, Ntilde: 209, Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214, times: 215, Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, Yacute: 221, THORN: 222, szlig: 223, agrave: 224, aacute: 225, acirc: 226, atilde: 227, auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233, ecirc: 234, euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239, eth: 240, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244, otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249, uacute: 250, ucirc: 251, uuml: 252, yacute: 253, thorn: 254, yuml: 255, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, permil: 8240, lsaquo: 8249, rsaquo: 8250, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830, oline: 8254, larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, hellip: 133, ndash: 150, mdash: 151, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165, brvbar: 166, brkbar: 166, sect: 167, uml: 168, die: 168, ordf: 170, laquo: 171, not: 172, shy: 173, macr: 175, hibar: 175, plusmn: 177, sup2: 178, sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, cedil: 184, sup1: 185, ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190, iquest: 191, Alpha: 913, alpha: 945, Beta: 914, beta: 946, Gamma: 915, gamma: 947, Delta: 916, delta: 948, Epsilon: 917, epsilon: 949, Zeta: 918, zeta: 950, Eta: 919, eta: 951, Theta: 920, theta: 952, Iota: 921, iota: 953, Kappa: 922, kappa: 954, Lambda: 923, lambda: 955, Mu: 924, mu: 956, Nu: 925, nu: 957, Xi: 926, xi: 958, Omicron: 927, omicron: 959, Pi: 928, pi: 960, Rho: 929, rho: 961, Sigma: 931, sigma: 963, Tau: 932, tau: 964, Upsilon: 933, upsilon: 965, Phi: 934, phi: 966, Chi: 935, chi: 967, Psi: 936, psi: 968, Omega: 937, omega: 969}
          if (chars[dec] !== undefined){
            dec = chars[dec];
          }
        }
        return String.fromCharCode(dec);
      });
    },
    base64Decode: function(str){
      return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    },
    parseResponse: function(rawResponse){
      return JSON.parse(rawResponse,function(key,val){
        if(typeof val === "string"){
          return api.htmlDecode(val);
        }
        return val;
      });
    },
    parseErrorMsg: function(rawResponse){
      try{
        var resp = this.parseResponse(rawResponse);
      } catch(e){
        return "Malformed server response";
      }
      var msg = null;

      if(resp){
        return resp.messageJSON || resp.exceptionMessage || resp.message || "Unexpected error has occurred";
      }

      return msg;
    },
    parsePaging: function(jsonResp){
      return {
        offset: jsonResp.pagination.offset,
        limit: jsonResp.pagination.limit,
        total: jsonResp.pagination.totalRecords
      };
    },
    createNextPageCall: function(requestFunction,reqParams,paging){
      if(paging.offset + paging.limit >= paging.total){
        return null;
      }
      reqParams = reqParams?reqParams:{};

      return function(){
        reqParams.paging = {
          limit: paging.limit,
          offset: paging.offset + paging.limit
        };
        return requestFunction(reqParams);
      };
    }
  };

  return api;
})();
