
'use strict'

#===========================================================================================================
{ debug,                } = console
#-----------------------------------------------------------------------------------------------------------
SFMODULES                 = require 'bricabrac-sfmodules'
# SFMODULES                 = require 'bricabrac-sfmodules'
{ type_of,              } = SFMODULES.unstable.require_type_of()
{ show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
{ Get_random,           } = SFMODULES.unstable.require_get_random()
#-----------------------------------------------------------------------------------------------------------
{ Hollerith_typespace,  } = require './types'
types                     = new Hollerith_typespace()
#-----------------------------------------------------------------------------------------------------------
{ isDeepStrictEqual: equals,  } = require 'node:util'


# { regex,                } = require 'regex'
# { Grammar
#   Token
#   Lexeme                } = require 'interlex'
# { clean_assign,         } = SFMODULES.unstable.require_clean_assign()
# { encode,
#   decode,
#   log_to_base,
#   get_required_digits,
#   get_max_integer,      } = SFMODULES.unstable.require_anybase()
# { freeze,               } = Object
# { hide,
#   set_getter,           } = SFMODULES.require_managed_property_tools()


#===========================================================================================================
internals =

  #---------------------------------------------------------------------------------------------------------
  get_random_vdx_producer: ({
    seed        = null,
    min_length  = 1,
    max_length  = 5,
    min_idx     = -999,
    max_idx     = +999, }={}) ->
    get_random      = new Get_random { seed: null, on_stats: null, }
    get_rnd_length  = get_random.integer_producer { min: min_length, max: max_length, }
    get_rnd_idx     = get_random.integer_producer { min: min_idx,    max: max_idx,    }
    return get_rnd_vdx = -> ( get_rnd_idx() for _ in [ 1 .. get_rnd_length() ] )


#===========================================================================================================
class Test_hollerith

  #---------------------------------------------------------------------------------------------------------
  constructor: ( codec ) ->
    @codec = types.hollerith.validate codec
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _walk_first_idxs: ( codec, delta, rnd_vdx_cfg, get_random ) ->
    yield idx for idx in [ codec.cfg._min_integer         .. codec.cfg._min_integer + delta ]
    yield idx for idx in [ rnd_vdx_cfg.min_idx            .. rnd_vdx_cfg.max_idx            ]
    yield idx for idx in [ codec.cfg._max_integer - delta .. codec.cfg._max_integer         ]
    get_random_idx = get_random.integer_producer { min: rnd_vdx_cfg.min_idx, max: rnd_vdx_cfg.max_idx, }
    yield get_random_idx() for _ in [ 1 .. 1000 ]
    return null

  #---------------------------------------------------------------------------------------------------------
  test_sorting: ->
    rnd_vdx_cfg                 =
      seed:         null
      min_length:   1
      max_length:   @codec.cfg.dimension - 1
      min_idx:      Math.max @codec.cfg._min_integer, -2000
      max_idx:      Math.min @codec.cfg._max_integer, +2000
    #.......................................................................................................
    seed                        = 8475622
    get_random                  = new Get_random { seed, }
    get_random_vdx              = internals.get_random_vdx_producer rnd_vdx_cfg
    probe_sub_count             = 3
    probes_sortkey              = []
    first_idx_walker            = @_walk_first_idxs @codec, 500, rnd_vdx_cfg, get_random
    #.......................................................................................................
    for first_idx from first_idx_walker
      for _ in [ 1 .. probe_sub_count ]
        vdx = [ first_idx, get_random_vdx()..., ]
        sk  = @codec.encode_vdx vdx
        probes_sortkey.push { vdx, sk, }
    #.......................................................................................................
    probes_sortkey    = get_random.shuffle probes_sortkey
    probes_vdx        = probes_sortkey[ .. ]
    #.......................................................................................................
    sort_by_vdx       = ( a, b ) ->
      a = a.vdx
      b = b.vdx
      for idx in [ 0 ... ( Math.max a.length, b.length ) ]
        da = a[ idx ] ? 0
        db = b[ idx ] ? 0
        continue if da is db
        return -1 if da < db
        return +1
      return null
    #.......................................................................................................
    sort_by_sortkey   = ( a, b ) ->
      a = a.sk
      b = b.sk
      return  0 if a is b
      return -1 if a < b
      return +1
    #.......................................................................................................
    hit_count   = 0
    miss_count  = 0
    #.......................................................................................................
    probes_vdx.sort     sort_by_vdx
    probes_sortkey.sort sort_by_sortkey
    for probe_vdx, idx in probes_vdx
      probe_sortkey = probes_sortkey[ idx ]
      if probe_sortkey.sk is probe_vdx.sk then  hit_count++
      else                                      miss_count++
    #.......................................................................................................
    R = { probe_count: probes_sortkey.length, hit_count, miss_count, success: ( miss_count is 0 ), }
    debug 'Ωvdx___1', "testing results"
    debug 'Ωvdx___2', R
    return R


#===========================================================================================================
module.exports = do => { Test_hollerith, internals, }
