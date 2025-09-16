(function() {
  'use strict';
  var Get_random, Hollerith_typespace, SFMODULES, Test_hollerith, debug, equals, internals, rpr, type_of, types;

  //===========================================================================================================
  ({debug} = console);

  //-----------------------------------------------------------------------------------------------------------
  SFMODULES = require('bricabrac-single-file-modules');

  // SFMODULES                 = require 'bricabrac-single-file-modules'
  ({type_of} = SFMODULES.unstable.require_type_of());

  ({
    show_no_colors: rpr
  } = SFMODULES.unstable.require_show());

  ({Get_random} = SFMODULES.unstable.require_get_random());

  //-----------------------------------------------------------------------------------------------------------
  ({Hollerith_typespace} = require('./types'));

  types = new Hollerith_typespace();

  ({
    //-----------------------------------------------------------------------------------------------------------
    isDeepStrictEqual: equals
  } = require('node:util'));

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
  internals = {
    //---------------------------------------------------------------------------------------------------------
    get_random_vdx_producer: function({seed = null, min_length = 1, max_length = 5, min_idx = -999, max_idx = +999} = {}) {
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
  };

  //===========================================================================================================
  Test_hollerith = class Test_hollerith {
    //---------------------------------------------------------------------------------------------------------
    constructor(codec) {
      this.codec = types.hollerith.validate(codec);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    * _walk_first_idxs(codec, delta, rnd_vdx_cfg, get_random) {
      var _, get_random_idx, i, idx, j, k, l, ref, ref1, ref2, ref3, ref4, ref5;
      for (idx = i = ref = codec.cfg._min_integer, ref1 = codec.cfg._min_integer + delta; (ref <= ref1 ? i <= ref1 : i >= ref1); idx = ref <= ref1 ? ++i : --i) {
        yield idx;
      }
      for (idx = j = ref2 = rnd_vdx_cfg.min_idx, ref3 = rnd_vdx_cfg.max_idx; (ref2 <= ref3 ? j <= ref3 : j >= ref3); idx = ref2 <= ref3 ? ++j : --j) {
        yield idx;
      }
      for (idx = k = ref4 = codec.cfg._max_integer - delta, ref5 = codec.cfg._max_integer; (ref4 <= ref5 ? k <= ref5 : k >= ref5); idx = ref4 <= ref5 ? ++k : --k) {
        yield idx;
      }
      get_random_idx = get_random.integer_producer({
        min: rnd_vdx_cfg.min_idx,
        max: rnd_vdx_cfg.max_idx
      });
      for (_ = l = 1; l <= 1000; _ = ++l) {
        yield get_random_idx();
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    test_sorting() {
      var R, _, first_idx, first_idx_walker, get_random, get_random_vdx, hit_count, i, idx, j, len, miss_count, probe_sortkey, probe_sub_count, probe_vdx, probes_sortkey, probes_vdx, ref, rnd_vdx_cfg, seed, sk, sort_by_sortkey, sort_by_vdx, vdx;
      rnd_vdx_cfg = {
        seed: null,
        min_length: 1,
        max_length: this.codec.cfg.dimension - 1,
        min_idx: Math.max(this.codec.cfg._min_integer, -2000),
        max_idx: Math.min(this.codec.cfg._max_integer, +2000)
      };
      //.......................................................................................................
      seed = 8475622;
      get_random = new Get_random({seed});
      get_random_vdx = internals.get_random_vdx_producer(rnd_vdx_cfg);
      probe_sub_count = 3;
      probes_sortkey = [];
      first_idx_walker = this._walk_first_idxs(this.codec, 500, rnd_vdx_cfg, get_random);
//.......................................................................................................
      for (first_idx of first_idx_walker) {
        for (_ = i = 1, ref = probe_sub_count; (1 <= ref ? i <= ref : i >= ref); _ = 1 <= ref ? ++i : --i) {
          vdx = [first_idx, ...get_random_vdx()];
          sk = this.codec.encode_vdx(vdx);
          probes_sortkey.push({vdx, sk});
        }
      }
      //.......................................................................................................
      probes_sortkey = get_random.shuffle(probes_sortkey);
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
      hit_count = 0;
      miss_count = 0;
      //.......................................................................................................
      probes_vdx.sort(sort_by_vdx);
      probes_sortkey.sort(sort_by_sortkey);
      for (idx = j = 0, len = probes_vdx.length; j < len; idx = ++j) {
        probe_vdx = probes_vdx[idx];
        probe_sortkey = probes_sortkey[idx];
        if (probe_sortkey.sk === probe_vdx.sk) {
          hit_count++;
        } else {
          miss_count++;
        }
      }
      //.......................................................................................................
      R = {
        probe_count: probes_sortkey.length,
        hit_count,
        miss_count,
        success: miss_count === 0
      };
      debug('Ωvdx___1', "testing results");
      debug('Ωvdx___2', R);
      return R;
    }

  };

  //===========================================================================================================
  module.exports = (() => {
    return {Test_hollerith, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Rlc3QtaG9sbGVyaXRoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxVQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsY0FBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1QixFQUhBOzs7RUFLQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUixFQUw1Qjs7O0VBT0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGtCQUFuQixDQUFBLENBQTVCLEVBVEE7OztFQVdBLENBQUEsQ0FBRSxtQkFBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSLENBQTVCOztFQUNBLEtBQUEsR0FBNEIsSUFBSSxtQkFBSixDQUFBOztFQUU1QixDQUFBLENBQUE7O0lBQUUsaUJBQUEsRUFBbUI7RUFBckIsQ0FBQSxHQUFrQyxPQUFBLENBQVEsV0FBUixDQUFsQyxFQWRBOzs7Ozs7Ozs7Ozs7Ozs7OztFQWlDQSxTQUFBLEdBR0UsQ0FBQTs7SUFBQSx1QkFBQSxFQUF5QixRQUFBLENBQUMsQ0FDeEIsSUFBQSxHQUFjLElBRFUsRUFFeEIsVUFBQSxHQUFjLENBRlUsRUFHeEIsVUFBQSxHQUFjLENBSFUsRUFJeEIsT0FBQSxHQUFjLENBQUMsR0FKUyxFQUt4QixPQUFBLEdBQWMsQ0FBQyxHQUxTLElBS0YsQ0FBQSxDQUxDLENBQUE7QUFN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eEI7O01BeUNJLFNBQUEsR0FBYztNQUNkLFVBQUEsR0FBYyxFQTFDbEI7O01BNENJLFVBQVUsQ0FBQyxJQUFYLENBQW9CLFdBQXBCO01BQ0EsY0FBYyxDQUFDLElBQWYsQ0FBb0IsZUFBcEI7TUFDQSxLQUFBLHdEQUFBOztRQUNFLGFBQUEsR0FBZ0IsY0FBYyxDQUFFLEdBQUY7UUFDOUIsSUFBRyxhQUFhLENBQUMsRUFBZCxLQUFvQixTQUFTLENBQUMsRUFBakM7VUFBMEMsU0FBQSxHQUExQztTQUFBLE1BQUE7VUFDMEMsVUFBQSxHQUQxQzs7TUFGRixDQTlDSjs7TUFtREksQ0FBQSxHQUFJO1FBQUUsV0FBQSxFQUFhLGNBQWMsQ0FBQyxNQUE5QjtRQUFzQyxTQUF0QztRQUFpRCxVQUFqRDtRQUE2RCxPQUFBLEVBQVcsVUFBQSxLQUFjO01BQXRGO01BQ0osS0FBQSxDQUFNLFVBQU4sRUFBa0IsaUJBQWxCO01BQ0EsS0FBQSxDQUFNLFVBQU4sRUFBa0IsQ0FBbEI7QUFDQSxhQUFPO0lBdkRLOztFQWpCaEIsRUFqREE7OztFQTZIQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLENBQUEsQ0FBQSxHQUFBO1dBQUcsQ0FBRSxjQUFGLEVBQWtCLFNBQWxCO0VBQUgsQ0FBQTtBQTdIcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2luZ2xlLWZpbGUtbW9kdWxlcydcbiMgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBHZXRfcmFuZG9tLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2dldF9yYW5kb20oKVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IEhvbGxlcml0aF90eXBlc3BhY2UsICB9ID0gcmVxdWlyZSAnLi90eXBlcydcbnR5cGVzICAgICAgICAgICAgICAgICAgICAgPSBuZXcgSG9sbGVyaXRoX3R5cGVzcGFjZSgpXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnsgaXNEZWVwU3RyaWN0RXF1YWw6IGVxdWFscywgIH0gPSByZXF1aXJlICdub2RlOnV0aWwnXG5cblxuIyB7IHJlZ2V4LCAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAncmVnZXgnXG4jIHsgR3JhbW1hclxuIyAgIFRva2VuXG4jICAgTGV4ZW1lICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdpbnRlcmxleCdcbiMgeyBjbGVhbl9hc3NpZ24sICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2NsZWFuX2Fzc2lnbigpXG4jIHsgZW5jb2RlLFxuIyAgIGRlY29kZSxcbiMgICBsb2dfdG9fYmFzZSxcbiMgICBnZXRfcmVxdWlyZWRfZGlnaXRzLFxuIyAgIGdldF9tYXhfaW50ZWdlciwgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfYW55YmFzZSgpXG4jIHsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbiMgeyBoaWRlLFxuIyAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5pbnRlcm5hbHMgPVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZ2V0X3JhbmRvbV92ZHhfcHJvZHVjZXI6ICh7XG4gICAgc2VlZCAgICAgICAgPSBudWxsLFxuICAgIG1pbl9sZW5ndGggID0gMSxcbiAgICBtYXhfbGVuZ3RoICA9IDUsXG4gICAgbWluX2lkeCAgICAgPSAtOTk5LFxuICAgIG1heF9pZHggICAgID0gKzk5OSwgfT17fSkgLT5cbiAgICBnZXRfcmFuZG9tICAgICAgPSBuZXcgR2V0X3JhbmRvbSB7IHNlZWQ6IG51bGwsIG9uX3N0YXRzOiBudWxsLCB9XG4gICAgZ2V0X3JuZF9sZW5ndGggID0gZ2V0X3JhbmRvbS5pbnRlZ2VyX3Byb2R1Y2VyIHsgbWluOiBtaW5fbGVuZ3RoLCBtYXg6IG1heF9sZW5ndGgsIH1cbiAgICBnZXRfcm5kX2lkeCAgICAgPSBnZXRfcmFuZG9tLmludGVnZXJfcHJvZHVjZXIgeyBtaW46IG1pbl9pZHgsICAgIG1heDogbWF4X2lkeCwgICAgfVxuICAgIHJldHVybiBnZXRfcm5kX3ZkeCA9IC0+ICggZ2V0X3JuZF9pZHgoKSBmb3IgXyBpbiBbIDEgLi4gZ2V0X3JuZF9sZW5ndGgoKSBdIClcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIFRlc3RfaG9sbGVyaXRoXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBjb2RlYyApIC0+XG4gICAgQGNvZGVjID0gdHlwZXMuaG9sbGVyaXRoLnZhbGlkYXRlIGNvZGVjXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3dhbGtfZmlyc3RfaWR4czogKCBjb2RlYywgZGVsdGEsIHJuZF92ZHhfY2ZnLCBnZXRfcmFuZG9tICkgLT5cbiAgICB5aWVsZCBpZHggZm9yIGlkeCBpbiBbIGNvZGVjLmNmZy5fbWluX2ludGVnZXIgICAgICAgICAuLiBjb2RlYy5jZmcuX21pbl9pbnRlZ2VyICsgZGVsdGEgXVxuICAgIHlpZWxkIGlkeCBmb3IgaWR4IGluIFsgcm5kX3ZkeF9jZmcubWluX2lkeCAgICAgICAgICAgIC4uIHJuZF92ZHhfY2ZnLm1heF9pZHggICAgICAgICAgICBdXG4gICAgeWllbGQgaWR4IGZvciBpZHggaW4gWyBjb2RlYy5jZmcuX21heF9pbnRlZ2VyIC0gZGVsdGEgLi4gY29kZWMuY2ZnLl9tYXhfaW50ZWdlciAgICAgICAgIF1cbiAgICBnZXRfcmFuZG9tX2lkeCA9IGdldF9yYW5kb20uaW50ZWdlcl9wcm9kdWNlciB7IG1pbjogcm5kX3ZkeF9jZmcubWluX2lkeCwgbWF4OiBybmRfdmR4X2NmZy5tYXhfaWR4LCB9XG4gICAgeWllbGQgZ2V0X3JhbmRvbV9pZHgoKSBmb3IgXyBpbiBbIDEgLi4gMTAwMCBdXG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRlc3Rfc29ydGluZzogLT5cbiAgICBybmRfdmR4X2NmZyAgICAgICAgICAgICAgICAgPVxuICAgICAgc2VlZDogICAgICAgICBudWxsXG4gICAgICBtaW5fbGVuZ3RoOiAgIDFcbiAgICAgIG1heF9sZW5ndGg6ICAgQGNvZGVjLmNmZy5kaW1lbnNpb24gLSAxXG4gICAgICBtaW5faWR4OiAgICAgIE1hdGgubWF4IEBjb2RlYy5jZmcuX21pbl9pbnRlZ2VyLCAtMjAwMFxuICAgICAgbWF4X2lkeDogICAgICBNYXRoLm1pbiBAY29kZWMuY2ZnLl9tYXhfaW50ZWdlciwgKzIwMDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNlZWQgICAgICAgICAgICAgICAgICAgICAgICA9IDg0NzU2MjJcbiAgICBnZXRfcmFuZG9tICAgICAgICAgICAgICAgICAgPSBuZXcgR2V0X3JhbmRvbSB7IHNlZWQsIH1cbiAgICBnZXRfcmFuZG9tX3ZkeCAgICAgICAgICAgICAgPSBpbnRlcm5hbHMuZ2V0X3JhbmRvbV92ZHhfcHJvZHVjZXIgcm5kX3ZkeF9jZmdcbiAgICBwcm9iZV9zdWJfY291bnQgICAgICAgICAgICAgPSAzXG4gICAgcHJvYmVzX3NvcnRrZXkgICAgICAgICAgICAgID0gW11cbiAgICBmaXJzdF9pZHhfd2Fsa2VyICAgICAgICAgICAgPSBAX3dhbGtfZmlyc3RfaWR4cyBAY29kZWMsIDUwMCwgcm5kX3ZkeF9jZmcsIGdldF9yYW5kb21cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBmaXJzdF9pZHggZnJvbSBmaXJzdF9pZHhfd2Fsa2VyXG4gICAgICBmb3IgXyBpbiBbIDEgLi4gcHJvYmVfc3ViX2NvdW50IF1cbiAgICAgICAgdmR4ID0gWyBmaXJzdF9pZHgsIGdldF9yYW5kb21fdmR4KCkuLi4sIF1cbiAgICAgICAgc2sgID0gQGNvZGVjLmVuY29kZV92ZHggdmR4XG4gICAgICAgIHByb2Jlc19zb3J0a2V5LnB1c2ggeyB2ZHgsIHNrLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBwcm9iZXNfc29ydGtleSAgICA9IGdldF9yYW5kb20uc2h1ZmZsZSBwcm9iZXNfc29ydGtleVxuICAgIHByb2Jlc192ZHggICAgICAgID0gcHJvYmVzX3NvcnRrZXlbIC4uIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNvcnRfYnlfdmR4ICAgICAgID0gKCBhLCBiICkgLT5cbiAgICAgIGEgPSBhLnZkeFxuICAgICAgYiA9IGIudmR4XG4gICAgICBmb3IgaWR4IGluIFsgMCAuLi4gKCBNYXRoLm1heCBhLmxlbmd0aCwgYi5sZW5ndGggKSBdXG4gICAgICAgIGRhID0gYVsgaWR4IF0gPyAwXG4gICAgICAgIGRiID0gYlsgaWR4IF0gPyAwXG4gICAgICAgIGNvbnRpbnVlIGlmIGRhIGlzIGRiXG4gICAgICAgIHJldHVybiAtMSBpZiBkYSA8IGRiXG4gICAgICAgIHJldHVybiArMVxuICAgICAgcmV0dXJuIG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHNvcnRfYnlfc29ydGtleSAgID0gKCBhLCBiICkgLT5cbiAgICAgIGEgPSBhLnNrXG4gICAgICBiID0gYi5za1xuICAgICAgcmV0dXJuICAwIGlmIGEgaXMgYlxuICAgICAgcmV0dXJuIC0xIGlmIGEgPCBiXG4gICAgICByZXR1cm4gKzFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGhpdF9jb3VudCAgID0gMFxuICAgIG1pc3NfY291bnQgID0gMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcHJvYmVzX3ZkeC5zb3J0ICAgICBzb3J0X2J5X3ZkeFxuICAgIHByb2Jlc19zb3J0a2V5LnNvcnQgc29ydF9ieV9zb3J0a2V5XG4gICAgZm9yIHByb2JlX3ZkeCwgaWR4IGluIHByb2Jlc192ZHhcbiAgICAgIHByb2JlX3NvcnRrZXkgPSBwcm9iZXNfc29ydGtleVsgaWR4IF1cbiAgICAgIGlmIHByb2JlX3NvcnRrZXkuc2sgaXMgcHJvYmVfdmR4LnNrIHRoZW4gIGhpdF9jb3VudCsrXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXNzX2NvdW50KytcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgPSB7IHByb2JlX2NvdW50OiBwcm9iZXNfc29ydGtleS5sZW5ndGgsIGhpdF9jb3VudCwgbWlzc19jb3VudCwgc3VjY2VzczogKCBtaXNzX2NvdW50IGlzIDAgKSwgfVxuICAgIGRlYnVnICfOqXZkeF9fXzEnLCBcInRlc3RpbmcgcmVzdWx0c1wiXG4gICAgZGVidWcgJ86pdmR4X19fMicsIFJcbiAgICByZXR1cm4gUlxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PiB7IFRlc3RfaG9sbGVyaXRoLCBpbnRlcm5hbHMsIH1cbiJdfQ==
