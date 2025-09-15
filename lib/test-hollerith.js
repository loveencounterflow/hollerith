(function() {
  'use strict';
  var Get_random, Hollerith_typespace, SFMODULES, debug, rpr, test_hollerith, type_of;

  //===========================================================================================================
  ({debug} = console);

  //-----------------------------------------------------------------------------------------------------------
  SFMODULES = require('bricabrac-single-file-modules');

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({
    show_no_colors: rpr
  } = SFMODULES.unstable.require_show());

  ({Get_random} = SFMODULES.unstable.require_get_random());

  //-----------------------------------------------------------------------------------------------------------
  ({Hollerith_typespace} = require('./types'));

  // { regex,                } = require 'regex'
  // { Grammar
  //   Token
  //   Lexeme                } = require 'interlex'
  // { clean_assign,         } = SFMODULES.unstable.require_clean_assign()
  // { encode,
  //   decode,
  //   log_to_base,
  //   get_required_digits,
  //   get_max_integer,      } = SFMODULES.unstable.require_anybase()
  // { freeze,               } = Object
  // { hide,
  //   set_getter,           } = SFMODULES.require_managed_property_tools()

    //===========================================================================================================
  test_hollerith = class test_hollerith {
    //---------------------------------------------------------------------------------------------------------
    static get_random_vdx_producer({seed = null, min_length = 1, max_length = 5, min_idx = -999, max_idx = +999} = {}) {
      var get_random, get_rnd_idx, get_rnd_length, get_rnd_vdx;
      get_random = new Get_random({
        seed: null,
        on_stats: null
      });
      get_rnd_length = get_random.integer_producer({
        min: min_length,
        max: max_length
      });
      get_rnd_idx = get_random.integer_producer({
        min: min_idx,
        max: max_idx
      });
      return get_rnd_vdx = function() {
        var _, i, ref, results;
        results = [];
        for (_ = i = 1, ref = get_rnd_length(); (1 <= ref ? i <= ref : i >= ref); _ = 1 <= ref ? ++i : --i) {
          results.push(get_rnd_idx());
        }
        return results;
      };
    }

    //---------------------------------------------------------------------------------------------------------
    static test_sorting(codec) {
      var types;
      types = new Hollerith_typespace();
      types.hollerith.validate(codec);
      return true;
    }

    //---------------------------------------------------------------------------------------------------------
    hollerith_128_big_shuffle() {
      var _, encode, first_idx, get_random_vdx, i, idx, j, len, probe_sortkey, probe_sub_count, probe_vdx, probes_sortkey, probes_vdx, ref, rnd_vdx_cfg, shuffle, sk, sort_by_sortkey, sort_by_vdx, vdx, walk_first_idxs, Ωhllt_103;
      rnd_vdx_cfg = {
        seed: null,
        min_length: 1,
        max_length: codec.cfg.dimension - 1,
        min_idx: Math.max(codec.cfg._min_integer, -2000),
        max_idx: Math.min(codec.cfg._max_integer, +2000)
      };
      // debug 'Ωhllt__98', rnd_vdx_cfg
      // debug 'Ωhllt__99', codec.cfg._sortkey_width
      get_random_vdx = helpers.get_random_vdx_producer(rnd_vdx_cfg);
      probe_sub_count = 3;
      shuffle = GUY.rnd.get_shuffle(57, 88);
      encode = function(vdx) {
        return (codec.encode(vdx)).padEnd(codec.cfg._sortkey_width, codec.cfg._cipher);
      };
      probes_sortkey = [];
      // debug 'Ωhllt_100', rnd_vdx_cfg; process.exit 111
      //.......................................................................................................
      walk_first_idxs = function*() {
        var i, idx, j, k, ref, ref1, ref2, ref3, ref4, ref5;
        for (idx = i = ref = codec.cfg._min_integer, ref1 = codec.cfg._min_integer + 10; (ref <= ref1 ? i <= ref1 : i >= ref1); idx = ref <= ref1 ? ++i : --i) {
          yield idx;
        }
        for (idx = j = ref2 = rnd_vdx_cfg.min_idx, ref3 = rnd_vdx_cfg.max_idx; (ref2 <= ref3 ? j <= ref3 : j >= ref3); idx = ref2 <= ref3 ? ++j : --j) {
          yield idx;
        }
        for (idx = k = ref4 = codec.cfg._max_integer - 10, ref5 = codec.cfg._max_integer; (ref4 <= ref5 ? k <= ref5 : k >= ref5); idx = ref4 <= ref5 ? ++k : --k) {
          yield idx;
        }
        return null;
      };
//.......................................................................................................
      for (first_idx of walk_first_idxs()) {
// for first_idx in [ -100 .. +100 ]
// debug 'Ωhllt_101', { first_idx, }
        for (_ = i = 1, ref = probe_sub_count; (1 <= ref ? i <= ref : i >= ref); _ = 1 <= ref ? ++i : --i) {
          vdx = [first_idx, ...get_random_vdx()];
          sk = encode(vdx);
          probes_sortkey.push({vdx, sk});
        }
      }
      //.......................................................................................................
      probes_sortkey = shuffle(probes_sortkey);
      probes_vdx = probes_sortkey.slice(0);
      //.......................................................................................................
      sort_by_vdx = function(a, b) {
        var da, db, idx, j, ref1, ref2, ref3;
        a = a.vdx;
        b = b.vdx;
        for (idx = j = 0, ref1 = Math.max(a.length, b.length); (0 <= ref1 ? j < ref1 : j > ref1); idx = 0 <= ref1 ? ++j : --j) {
          da = (ref2 = a[idx]) != null ? ref2 : 0;
          db = (ref3 = b[idx]) != null ? ref3 : 0;
          if (da === db) {
            continue;
          }
          if (da < db) {
            return -1;
          }
          return +1;
        }
        return null;
      };
      //.......................................................................................................
      sort_by_sortkey = function(a, b) {
        a = a.sk;
        b = b.sk;
        if (a === b) {
          return 0;
        }
        if (a < b) {
          return -1;
        }
        return +1;
      };
      //.......................................................................................................
      probes_vdx.sort(sort_by_vdx);
      probes_sortkey.sort(sort_by_sortkey);
      for (idx = j = 0, len = probes_vdx.length; j < len; idx = ++j) {
        probe_vdx = probes_vdx[idx];
        probe_sortkey = probes_sortkey[idx];
        // whisper 'Ωhllt_102', ( gold probe_sortkey.sk ), ( red probe_vdx.vdx ), ( lime probe_sortkey.vdx )
        this.eq((Ωhllt_103 = function() {
          return probe_sortkey.vdx;
        }), probe_vdx.vdx);
      }
      //.......................................................................................................
      return null;
    }

  };

  //===========================================================================================================
  module.exports = (() => {
    return {test_hollerith};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Rlc3QtaG9sbGVyaXRoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxVQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxjQUFBLEVBQUEsT0FBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1QixFQUhBOzs7RUFLQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGtCQUFuQixDQUFBLENBQTVCLEVBUkE7OztFQVVBLENBQUEsQ0FBRSxtQkFBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSLENBQTVCLEVBVkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBNkJNLGlCQUFOLE1BQUEsZUFBQSxDQUFBOztJQUc0QixPQUF6Qix1QkFBeUIsQ0FBQyxDQUN6QixJQUFBLEdBQWMsSUFEVyxFQUV6QixVQUFBLEdBQWMsQ0FGVyxFQUd6QixVQUFBLEdBQWMsQ0FIVyxFQUl6QixPQUFBLEdBQWMsQ0FBQyxHQUpVLEVBS3pCLE9BQUEsR0FBYyxDQUFDLEdBTFUsSUFLSCxDQUFBLENBTEUsQ0FBQTtBQU01QixVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBO01BQUksVUFBQSxHQUFrQixJQUFJLFVBQUosQ0FBZTtRQUFFLElBQUEsRUFBTSxJQUFSO1FBQWMsUUFBQSxFQUFVO01BQXhCLENBQWY7TUFDbEIsY0FBQSxHQUFrQixVQUFVLENB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c291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IEdldF9yYW5kb20sICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfZ2V0X3JhbmRvbSgpXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnsgSG9sbGVyaXRoX3R5cGVzcGFjZSwgIH0gPSByZXF1aXJlICcuL3R5cGVzJ1xuXG5cbiMgeyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xuIyB7IEdyYW1tYXJcbiMgICBUb2tlblxuIyAgIExleGVtZSAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnaW50ZXJsZXgnXG4jIHsgY2xlYW5fYXNzaWduLCAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9jbGVhbl9hc3NpZ24oKVxuIyB7IGVuY29kZSxcbiMgICBkZWNvZGUsXG4jICAgbG9nX3RvX2Jhc2UsXG4jICAgZ2V0X3JlcXVpcmVkX2RpZ2l0cyxcbiMgICBnZXRfbWF4X2ludGVnZXIsICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxuIyB7IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG4jIHsgaGlkZSxcbiMgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgdGVzdF9ob2xsZXJpdGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBnZXRfcmFuZG9tX3ZkeF9wcm9kdWNlcjogKHtcbiAgICBzZWVkICAgICAgICA9IG51bGwsXG4gICAgbWluX2xlbmd0aCAgPSAxLFxuICAgIG1heF9sZW5ndGggID0gNSxcbiAgICBtaW5faWR4ICAgICA9IC05OTksXG4gICAgbWF4X2lkeCAgICAgPSArOTk5LCB9PXt9KSAtPlxuICAgIGdldF9yYW5kb20gICAgICA9IG5ldyBHZXRfcmFuZG9tIHsgc2VlZDogbnVsbCwgb25fc3RhdHM6IG51bGwsIH1cbiAgICBnZXRfcm5kX2xlbmd0aCAgPSBnZXRfcmFuZG9tLmludGVnZXJfcHJvZHVjZXIgeyBtaW46IG1pbl9sZW5ndGgsIG1heDogbWF4X2xlbmd0aCwgfVxuICAgIGdldF9ybmRfaWR4ICAgICA9IGdldF9yYW5kb20uaW50ZWdlcl9wcm9kdWNlciB7IG1pbjogbWluX2lkeCwgICAgbWF4OiBtYXhfaWR4LCAgICB9XG4gICAgcmV0dXJuIGdldF9ybmRfdmR4ID0gLT4gKCBnZXRfcm5kX2lkeCgpIGZvciBfIGluIFsgMSAuLiBnZXRfcm5kX2xlbmd0aCgpIF0gKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHRlc3Rfc29ydGluZzogKCBjb2RlYyApIC0+XG4gICAgdHlwZXMgPSBuZXcgSG9sbGVyaXRoX3R5cGVzcGFjZSgpXG4gICAgdHlwZXMuaG9sbGVyaXRoLnZhbGlkYXRlIGNvZGVjXG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGhvbGxlcml0aF8xMjhfYmlnX3NodWZmbGU6IC0+XG4gICAgcm5kX3ZkeF9jZmcgICAgICAgICAgICAgICAgID1cbiAgICAgIHNlZWQ6ICAgICAgICAgbnVsbFxuICAgICAgbWluX2xlbmd0aDogICAxXG4gICAgICBtYXhfbGVuZ3RoOiAgIGNvZGVjLmNmZy5kaW1lbnNpb24gLSAxXG4gICAgICBtaW5faWR4OiAgICAgIE1hdGgubWF4IGNvZGVjLmNmZy5fbWluX2ludGVnZXIsIC0yMDAwXG4gICAgICBtYXhfaWR4OiAgICAgIE1hdGgubWluIGNvZGVjLmNmZy5fbWF4X2ludGVnZXIsICsyMDAwXG4gICAgIyBkZWJ1ZyAnzqlobGx0X185OCcsIHJuZF92ZHhfY2ZnXG4gICAgIyBkZWJ1ZyAnzqlobGx0X185OScsIGNvZGVjLmNmZy5fc29ydGtleV93aWR0aFxuICAgIGdldF9yYW5kb21fdmR4ICAgICAgICAgICAgICA9IGhlbHBlcnMuZ2V0X3JhbmRvbV92ZHhfcHJvZHVjZXIgcm5kX3ZkeF9jZmdcbiAgICBwcm9iZV9zdWJfY291bnQgICAgICAgICAgICAgPSAzXG4gICAgc2h1ZmZsZSAgICAgICAgICAgICAgICAgICAgID0gR1VZLnJuZC5nZXRfc2h1ZmZsZSA1NywgODhcbiAgICBlbmNvZGUgICAgICAgICAgICAgICAgICAgICAgPSAoIHZkeCApIC0+ICggY29kZWMuZW5jb2RlIHZkeCApLnBhZEVuZCBjb2RlYy5jZmcuX3NvcnRrZXlfd2lkdGgsIGNvZGVjLmNmZy5fY2lwaGVyXG4gICAgcHJvYmVzX3NvcnRrZXkgICAgICAgICAgICAgID0gW11cbiAgICAjIGRlYnVnICfOqWhsbHRfMTAwJywgcm5kX3ZkeF9jZmc7IHByb2Nlc3MuZXhpdCAxMTFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHdhbGtfZmlyc3RfaWR4cyAgICAgICAgICAgICA9IC0+XG4gICAgICB5aWVsZCBpZHggZm9yIGlkeCBpbiBbIGNvZGVjLmNmZy5fbWluX2ludGVnZXIgICAgICAuLiBjb2RlYy5jZmcuX21pbl9pbnRlZ2VyICsgMTAgXVxuICAgICAgeWllbGQgaWR4IGZvciBpZHggaW4gWyBybmRfdmR4X2NmZy5taW5faWR4ICAgICAgICAgLi4gcm5kX3ZkeF9jZmcubWF4X2lkeCAgICAgICAgIF1cbiAgICAgIHlpZWxkIGlkeCBmb3IgaWR4IGluIFsgY29kZWMuY2ZnLl9tYXhfaW50ZWdlciAtIDEwIC4uIGNvZGVjLmNmZy5fbWF4X2ludGVnZXIgICAgICBdXG4gICAgICByZXR1cm4gbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIGZpcnN0X2lkeCBmcm9tIHdhbGtfZmlyc3RfaWR4cygpXG4gICAgIyBmb3IgZmlyc3RfaWR4IGluIFsgLTEwMCAuLiArMTAwIF1cbiAgICAgICMgZGVidWcgJ86paGxsdF8xMDEnLCB7IGZpcnN0X2lkeCwgfVxuICAgICAgZm9yIF8gaW4gWyAxIC4uIHByb2JlX3N1Yl9jb3VudCBdXG4gICAgICAgIHZkeCA9IFsgZmlyc3RfaWR4LCBnZXRfcmFuZG9tX3ZkeCgpLi4uLCBdXG4gICAgICAgIHNrICA9IGVuY29kZSB2ZHhcbiAgICAgICAgcHJvYmVzX3NvcnRrZXkucHVzaCB7IHZkeCwgc2ssIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHByb2Jlc19zb3J0a2V5ICAgID0gc2h1ZmZsZSBwcm9iZXNfc29ydGtleVxuICAgIHByb2Jlc192ZHggICAgICAgID0gcHJvYmVzX3NvcnRrZXlbIC4uIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNvcnRfYnlfdmR4ICAgICAgID0gKCBhLCBiICkgLT5cbiAgICAgIGEgPSBhLnZkeFxuICAgICAgYiA9IGIudmR4XG4gICAgICBmb3IgaWR4IGluIFsgMCAuLi4gKCBNYXRoLm1heCBhLmxlbmd0aCwgYi5sZW5ndGggKSBdXG4gICAgICAgIGRhID0gYVsgaWR4IF0gPyAwXG4gICAgICAgIGRiID0gYlsgaWR4IF0gPyAwXG4gICAgICAgIGNvbnRpbnVlIGlmIGRhIGlzIGRiXG4gICAgICAgIHJldHVybiAtMSBpZiBkYSA8IGRiXG4gICAgICAgIHJldHVybiArMVxuICAgICAgcmV0dXJuIG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNvcnRfYnlfc29ydGtleSAgID0gKCBhLCBiICkgLT5cbiAgICAgIGEgPSBhLnNrXG4gICAgICBiID0gYi5za1xuICAgICAgcmV0dXJuICAwIGlmIGEgaXMgYlxuICAgICAgcmV0dXJuIC0xIGlmIGEgPCBiXG4gICAgICByZXR1cm4gKzFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHByb2Jlc192ZHguc29ydCAgICAgc29ydF9ieV92ZHhcbiAgICBwcm9iZXNfc29ydGtleS5zb3J0IHNvcnRfYnlfc29ydGtleVxuICAgIGZvciBwcm9iZV92ZHgsIGlkeCBpbiBwcm9iZXNfdmR4XG4gICAgICBwcm9iZV9zb3J0a2V5ID0gcHJvYmVzX3NvcnRrZXlbIGlkeCBdXG4gICAgICAjIHdoaXNwZXIgJ86paGxsdF8xMDInLCAoIGdvbGQgcHJvYmVfc29ydGtleS5zayApLCAoIHJlZCBwcm9iZV92ZHgudmR4ICksICggbGltZSBwcm9iZV9zb3J0a2V5LnZkeCApXG4gICAgICBAZXEgKCDOqWhsbHRfMTAzID0gLT4gcHJvYmVfc29ydGtleS52ZHggKSwgcHJvYmVfdmR4LnZkeFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIG51bGxcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT4geyB0ZXN0X2hvbGxlcml0aCwgfVxuIl19
