(function() {
  'use strict';
  var C, Vindex, constants, constants_10, constants_128, decodeBigInt, encodeBigInt, internals;

  //===========================================================================================================
  ({encodeBigInt, decodeBigInt} = TMP_require_encode_in_alphabet());

  //-----------------------------------------------------------------------------------------------------------
  constants_128 = Object.freeze({
    max_integer: Number.MAX_SAFE_INTEGER,
    min_integer: Number.MIN_SAFE_INTEGER,
    zpuns: 'ãäåæçèéêëìíîïðñòóôõö÷', // zero and positive uniliteral numbers
    nuns: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ', // negative          uniliteral numbers
    zpun_max: +20,
    nun_min: -20,
    zero_pad_length: 8,
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`' + 'abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    pmag: ' øùúûüýþÿ', // positive 'magnifier' for 1 to 8 positive digits
    nmag: ' ÎÍÌËÊÉÈÇ', // negative 'magnifier' for 1 to 8 negative digits
    nlead_re: /^2Æ*/ // 'negative leader', discardable leading digits of lifted negative numbers
  });

  
  //-----------------------------------------------------------------------------------------------------------
  constants_10 = Object.freeze({
    max_integer: +999,
    min_integer: -999,
    zpuns: 'ãäåæ', // zero and positive uniliteral numbers
    nuns: 'ÏÐÑ', // negative          uniliteral numbers
    zpun_max: +3,
    nun_min: -3,
    zero_pad_length: 3,
    alphabet: '0123456789',
    pmag: ' øùúûüýþÿ', // positive 'magnifier' for 1 to 8 positive digits
    nmag: ' ÎÍÌËÊÉÈÇ', // negative 'magnifier' for 1 to 8 negative digits
    nlead_re: /^9*(?=[0-9])/ // 'negative leader', discardable leading digits of lifted negative numbers
  });

  
  //-----------------------------------------------------------------------------------------------------------
  // constants = C = constants_128
  constants = C = constants_10;

  //-----------------------------------------------------------------------------------------------------------
  internals = Object.freeze({constants});

  //===========================================================================================================
  Vindex = class Vindex {
    //---------------------------------------------------------------------------------------------------------
    encode(integer_or_list) {
      var n, type;
      /* TAINT use proper validation */
      if (Array.isArray(integer_or_list)) {
        return ((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = integer_or_list.length; i < len; i++) {
            n = integer_or_list[i];
            results.push(this.encode(n));
          }
          return results;
        }).call(this)).join('');
      }
      //.......................................................................................................
      n = integer_or_list;
      if (!Number.isFinite(n)) {
        type = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
        throw new Error(`Ωvdx__42 expected a float, got a ${type}`);
      }
      if (!((C.min_integer <= n && n <= C.max_integer))) {
        throw new Error(`Ωvdx__43 expected a float between ${C.min_integer} and ${C.max_integer}, got ${n}`);
      }
      //.......................................................................................................
      return this.encode_integer(n);
    }

    //---------------------------------------------------------------------------------------------------------
    encode_integer(n) {
      var R;
      if ((0 <= n && n <= C.zpun_max)) {
        /* NOTE call only where assured `n` is integer within magnitude of `Number.MAX_SAFE_INTEGER` */
        //.......................................................................................................
        // Zero or small positive:
        return C.zpuns.at(n);
      }
      if ((C.nun_min <= n && n < 0)) {
        //.......................................................................................................
        // Small negative:
        return C.nuns.at(n);
      }
      //.......................................................................................................
      // Big positive:
      if (n > C.zpun_max) {
        R = encodeBigInt(n, C.alphabet);
        return (C.pmag.at(R.length)) + R;
      }
      //.......................................................................................................
      // Big negative:
      R = encodeBigInt(n + C.max_integer + 1, C.alphabet);
      if (R.length < C.zero_pad_length) {
        R = R.padStart(C.zero_pad_length, C.alphabet.at(0));
      } else {
        R = R.replace(C.nlead_re, '');
      }
      return (C.nmag.at(R.length)) + R;
    }

  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBOzs7RUFHQSxDQUFBLENBQUUsWUFBRixFQUNFLFlBREYsQ0FBQSxHQUNzQiw4QkFBQSxDQUFBLENBRHRCLEVBSEE7OztFQU9BLGFBQUEsR0FBZ0IsTUFBTSxDQUFDLE1BQVAsQ0FDZDtJQUFBLFdBQUEsRUFBYyxNQUFNLENBQUMsZ0JBQXJCO0lBQ0EsV0FBQSxFQUFjLE1BQU0sQ0FBQyxnQkFEckI7SUFFQSxLQUFBLEVBQWMsdUJBRmQ7SUFHQSxJQUFBLEVBQWMsc0JBSGQ7SUFJQSxRQUFBLEVBQWMsQ0FBQyxFQUpmO0lBS0EsT0FBQSxFQUFjLENBQUMsRUFMZjtJQU1BLGVBQUEsRUFBaUIsQ0FOakI7SUFPQSxRQUFBLEVBQWMsK0RBQUEsR0FDSSxxRUFSbEI7OztJQVdBLElBQUEsRUFBYyxXQVhkO0lBWUEsSUFBQSxFQUFjLFdBWmQ7SUFhQSxRQUFBLEVBQWMsTUFiZDtFQUFBLENBRGMsRUFQaEI7Ozs7RUF3QkEsWUFBQSxHQUFlLE1BQU0sQ0FBQyxNQUFQLENBQ2I7SUFBQSxXQUFBLEVBQWMsQ0FBQyxHQUFmO0lBQ0EsV0FBQSxFQUFjLENBQUMsR0FEZjtJQUVBLEtBQUEsRUFBYyxNQUZkO0lBR0EsSUFBQSxFQUFjLEtBSGQ7SUFJQSxRQUFBLEVBQWMsQ0FBQyxDQUpmO0lBS0EsT0FBQSxFQUFjLENBQUMsQ0FMZjtJQU1BLGVBQUEsRUFBa0IsQ0FObEI7SUFPQSxRQUFBLEVBQWMsWUFQZDtJQVFBLElBQUEsRUFBYyxXQVJkO0lBU0EsSUFBQSxFQUFjLFdBVGQ7SUFVQSxRQUFBLEVBQWMsY0FWZDtFQUFBLENBRGEsRUF4QmY7Ozs7O0VBdUNBLFNBQUEsR0FBWSxDQUFBLEdBQUksYUF2Q2hCOzs7RUEwQ0EsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBRSxTQUFGLENBQWQsRUExQ1o7OztFQThDTSxTQUFOLE1BQUEsT0FBQSxDQUFBOztJQUdFLE1BQVEsQ0FBRSxlQUFGLENBQUE7QUFDVixVQUFBLENBQUEsRUFBQSxJQUFBOztNQUNJLElBQUcsS0FBSyxDQUFDLE9BQU4sQ0FBYyxlQUFkLENBQUg7QUFDRSxlQUFPOztBQUFFO1VBQUEsS0FBQSxpREFBQTs7eUJBQUEsSUFBQyxDQUFBLE1BQUQsQ0FBUSxDQUFSO1VBQUEsQ0FBQTs7cUJBQUYsQ0FBc0MsQ0FBQyxJQUF2QyxDQUE0QyxFQUE1QyxFQURUO09BREo7O01BSUksQ0FBQSxHQUFJO01BQ0osS0FBTyxNQUFNLENBQUMsUUFBUCxDQUFnQixDQUFoQixDQUFQO1FBQ0UsSUFBQSxHQUFPO1FBQ1AsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLGlDQUFBLENBQUEsQ0FBb0MsSUFBcEMsQ0FBQSxDQUFWLEVBRlI7O01BR0EsTUFBTyxDQUFBLENBQUMsQ0FBQyxXQUFGLElBQWlCLENBQWpCLElBQWlCLENBQWpCLElBQXNCLENBQUMsQ0FBQyxXQUF4QixFQUFQO1FBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLGtDQUFBLENBQUEsQ0FBcUMsQ0FBQyxDQUFDLFdBQXZDLENBQUEsS0FBQSxDQUFBLENBQTBELENBQUMsQ0FBQyxXQUE1RCxDQUFBLE1BQUEsQ0FBQSxDQUFnRixDQUFoRixDQUFBLENBQVYsRUFEUjtPQVJKOztBQVdJLGFBQU8sSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsQ0FBaEI7SUFaRCxDQURWOzs7SUFnQkUsY0FBZ0IsQ0FBRSxDQUFGLENBQUE7QUFDbEIsVUFBQTtNQUdJLElBQTJCLENBQUEsQ0FBQSxJQUFjLENBQWQsSUFBYyxDQUFkLElBQW1CLENBQUMsQ0FBQyxRQUFyQixDQUEzQjs7OztBQUFBLGVBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFSLENBQVcsQ0FBWCxFQUFUOztNQUdBLElBQTJCLENBQUEsQ0FBQyxDQUFDLE9BQUYsSUFBYyxDQUFkLElBQWMsQ0FBZCxHQUFtQixDQUFuQixDQUEzQjs7O0FBQUEsZUFBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQVAsQ0FBVyxDQUFYLEVBQVQ7T0FOSjs7O01BU0ksSUFBRyxDQUFBLEdBQUksQ0FBQyxDQUFDLFFBQVQ7UUFDRSxDQUFBLEdBQUksWUFBQSxDQUFhLENBQWIsRUFBZ0IsQ0FBQyxDQUFDLFFBQWxCO0FBQ0osZUFBTyxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBUCxDQUFVLENBQUMsQ0FBQyxNQUFaLENBQUYsQ0FBQSxHQUF5QixFQUZsQztPQVRKOzs7TUFjSSxDQUFBLEdBQU0sWUFBQSxDQUFlLENBQUEsR0FBSSxDQUFDLENBQUMsV0FBTixHQUFvQixDQUFuQyxFQUF3QyxDQUFDLENBQUMsUUFBMUM7TUFDTixJQUFHLENBQUMsQ0FBQyxNQUFGLEdBQVcsQ0FBQyxDQUFDLGVBQWhCO1FBQXdDLENBQUEsR0FBSSxDQUFDLENBQUMsUUFBRixDQUFXLENBQUMsQ0FBQyxlQUFiLEVBQThCLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBWCxDQUFjLENBQWQsQ0FBOUIsRUFBNUM7T0FBQSxNQUFBO1FBQ3dDLENBQUEsR0FBSSxDQUFDLENBQUMsT0FBRixDQUFVLENBQUMsQ0FBQyxRQUFaLEVBQXNCLEVBQXRCLEVBRDVDOztBQUVBLGFBQU8sQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQVAsQ0FBVSxDQUFDLENBQUMsTUFBWixDQUFGLENBQUEsR0FBeUI7SUFsQmxCOztFQWxCbEI7QUE5Q0EiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZW5jb2RlQmlnSW50LFxuICBkZWNvZGVCaWdJbnQsICAgfSA9IFRNUF9yZXF1aXJlX2VuY29kZV9pbl9hbHBoYWJldCgpXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEyOCA9IE9iamVjdC5mcmVlemVcbiAgbWF4X2ludGVnZXI6ICBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUlxuICBtaW5faW50ZWdlcjogIE51bWJlci5NSU5fU0FGRV9JTlRFR0VSXG4gIHpwdW5zOiAgICAgICAgJ8Ojw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtycgIyB6ZXJvIGFuZCBwb3NpdGl2ZSB1bmlsaXRlcmFsIG51bWJlcnNcbiAgbnVuczogICAgICAgICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoicgICMgbmVnYXRpdmUgICAgICAgICAgdW5pbGl0ZXJhbCBudW1iZXJzXG4gIHpwdW5fbWF4OiAgICAgKzIwXG4gIG51bl9taW46ICAgICAgLTIwXG4gIHplcm9fcGFkX2xlbmd0aDogOFxuICBhbHBoYWJldDogICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gJyBcXFxuICAgICAgICAgICAgICAgICAgKyAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpcKmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBwbWFnOiAgICAgICAgICcgw7jDucO6w7vDvMO9w77DvycgICMgcG9zaXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBwb3NpdGl2ZSBkaWdpdHNcbiAgbm1hZzogICAgICAgICAnIMOOw43DjMOLw4rDicOIw4cnICAjIG5lZ2F0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggbmVnYXRpdmUgZGlnaXRzXG4gIG5sZWFkX3JlOiAgICAgL14yw4YqLyAgICAgICMgJ25lZ2F0aXZlIGxlYWRlcicsIGRpc2NhcmRhYmxlIGxlYWRpbmcgZGlnaXRzIG9mIGxpZnRlZCBuZWdhdGl2ZSBudW1iZXJzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwID0gT2JqZWN0LmZyZWV6ZVxuICBtYXhfaW50ZWdlcjogICs5OTlcbiAgbWluX2ludGVnZXI6ICAtOTk5XG4gIHpwdW5zOiAgICAgICAgJ8Ojw6TDpcOmJyAjIHplcm8gYW5kIHBvc2l0aXZlIHVuaWxpdGVyYWwgbnVtYmVyc1xuICBudW5zOiAgICAgICAgICfDj8OQw5EnICAjIG5lZ2F0aXZlICAgICAgICAgIHVuaWxpdGVyYWwgbnVtYmVyc1xuICB6cHVuX21heDogICAgICszXG4gIG51bl9taW46ICAgICAgLTNcbiAgemVyb19wYWRfbGVuZ3RoOiAgM1xuICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICBwbWFnOiAgICAgICAgICcgw7jDucO6w7vDvMO9w77DvycgICAjIHBvc2l0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggcG9zaXRpdmUgZGlnaXRzXG4gIG5tYWc6ICAgICAgICAgJyDDjsONw4zDi8OKw4nDiMOHJyAgICMgbmVnYXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBuZWdhdGl2ZSBkaWdpdHNcbiAgbmxlYWRfcmU6ICAgICAvXjkqKD89WzAtOV0pLyAgICAgICAgICMgJ25lZ2F0aXZlIGxlYWRlcicsIGRpc2NhcmRhYmxlIGxlYWRpbmcgZGlnaXRzIG9mIGxpZnRlZCBuZWdhdGl2ZSBudW1iZXJzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBjb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEyOFxuY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMFxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBjb25zdGFudHMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIFZpbmRleFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlOiAoIGludGVnZXJfb3JfbGlzdCApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICBpZiBBcnJheS5pc0FycmF5IGludGVnZXJfb3JfbGlzdFxuICAgICAgcmV0dXJuICggQGVuY29kZSBuIGZvciBuIGluIGludGVnZXJfb3JfbGlzdCApLmpvaW4gJydcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG4gPSBpbnRlZ2VyX29yX2xpc3RcbiAgICB1bmxlc3MgTnVtYmVyLmlzRmluaXRlIG5cbiAgICAgIHR5cGUgPSAnWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pdmR4X180MiBleHBlY3RlZCBhIGZsb2F0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3MgQy5taW5faW50ZWdlciA8PSBuIDw9IEMubWF4X2ludGVnZXJcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pdmR4X180MyBleHBlY3RlZCBhIGZsb2F0IGJldHdlZW4gI3tDLm1pbl9pbnRlZ2VyfSBhbmQgI3tDLm1heF9pbnRlZ2VyfSwgZ290ICN7bn1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIEBlbmNvZGVfaW50ZWdlciBuXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGVfaW50ZWdlcjogKCBuICkgLT5cbiAgICAjIyMgTk9URSBjYWxsIG9ubHkgd2hlcmUgYXNzdXJlZCBgbmAgaXMgaW50ZWdlciB3aXRoaW4gbWFnbml0dWRlIG9mIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAgIyMjXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIFplcm8gb3Igc21hbGwgcG9zaXRpdmU6XG4gICAgcmV0dXJuICggQy56cHVucy5hdCBuICkgaWYgMCAgICAgICAgICA8PSBuIDw9IEMuenB1bl9tYXhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgU21hbGwgbmVnYXRpdmU6XG4gICAgcmV0dXJuICggQy5udW5zLmF0ICBuICkgaWYgQy5udW5fbWluICA8PSBuIDwgIDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgQmlnIHBvc2l0aXZlOlxuICAgIGlmIG4gPiBDLnpwdW5fbWF4XG4gICAgICBSID0gZW5jb2RlQmlnSW50IG4sIEMuYWxwaGFiZXRcbiAgICAgIHJldHVybiAoIEMucG1hZy5hdCBSLmxlbmd0aCApICsgUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBCaWcgbmVnYXRpdmU6XG4gICAgUiA9ICggZW5jb2RlQmlnSW50ICggbiArIEMubWF4X2ludGVnZXIgKyAxICksIEMuYWxwaGFiZXQgKVxuICAgIGlmIFIubGVuZ3RoIDwgQy56ZXJvX3BhZF9sZW5ndGggICB0aGVuICBSID0gUi5wYWRTdGFydCBDLnplcm9fcGFkX2xlbmd0aCwgQy5hbHBoYWJldC5hdCAwXG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIgPSBSLnJlcGxhY2UgQy5ubGVhZF9yZSwgJydcbiAgICByZXR1cm4gKCBDLm5tYWcuYXQgUi5sZW5ndGggKSArIFJcbiJdfQ==
