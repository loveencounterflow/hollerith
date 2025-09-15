
'use strict'

#===========================================================================================================
{ debug,                } = console
#-----------------------------------------------------------------------------------------------------------
SFMODULES                 = require 'bricabrac-single-file-modules'
{ type_of,              } = SFMODULES.unstable.require_type_of()
{ show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
{ Get_random,           } = SFMODULES.unstable.require_get_random()
#-----------------------------------------------------------------------------------------------------------
{ Hollerith_typespace,  } = require './types'


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
class test_hollerith

  #---------------------------------------------------------------------------------------------------------
  @get_random_vdx_producer: ({
    seed        = null,
    min_length  = 1,
    max_length  = 5,
    min_idx     = -999,
    max_idx     = +999, }={}) ->
    get_random      = new Get_random { seed: null, on_stats: null, }
    get_rnd_length  = get_random.integer_producer { min: min_length, max: max_length, }
    get_rnd_idx     = get_random.integer_producer { min: min_idx,    max: max_idx,    }
    return get_rnd_vdx = -> ( get_rnd_idx() for _ in [ 1 .. get_rnd_length() ] )

  #---------------------------------------------------------------------------------------------------------
  @test_sorting: ( codec ) ->
    types = new Hollerith_typespace()
    types.hollerith.validate codec
    return true

  #---------------------------------------------------------------------------------------------------------
  hollerith_128_big_shuffle: ->
    rnd_vdx_cfg                 =
      seed:         null
      min_length:   1
      max_length:   codec.cfg.dimension - 1
      min_idx:      Math.max codec.cfg._min_integer, -2000
      max_idx:      Math.min codec.cfg._max_integer, +2000
    # debug 'Ωhllt__98', rnd_vdx_cfg
    # debug 'Ωhllt__99', codec.cfg._sortkey_width
    get_random_vdx              = helpers.get_random_vdx_producer rnd_vdx_cfg
    probe_sub_count             = 3
    shuffle                     = GUY.rnd.get_shuffle 57, 88
    encode                      = ( vdx ) -> ( codec.encode vdx ).padEnd codec.cfg._sortkey_width, codec.cfg._cipher
    probes_sortkey              = []
    # debug 'Ωhllt_100', rnd_vdx_cfg; process.exit 111
    #.......................................................................................................
    walk_first_idxs             = ->
      yield idx for idx in [ codec.cfg._min_integer      .. codec.cfg._min_integer + 10 ]
      yield idx for idx in [ rnd_vdx_cfg.min_idx         .. rnd_vdx_cfg.max_idx         ]
      yield idx for idx in [ codec.cfg._max_integer - 10 .. codec.cfg._max_integer      ]
      return null
    #.......................................................................................................
    for first_idx from walk_first_idxs()
    # for first_idx in [ -100 .. +100 ]
      # debug 'Ωhllt_101', { first_idx, }
      for _ in [ 1 .. probe_sub_count ]
        vdx = [ first_idx, get_random_vdx()..., ]
        sk  = encode vdx
        probes_sortkey.push { vdx, sk, }
    #.......................................................................................................
    probes_sortkey    = shuffle probes_sortkey
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
    probes_vdx.sort     sort_by_vdx
    probes_sortkey.sort sort_by_sortkey
    for probe_vdx, idx in probes_vdx
      probe_sortkey = probes_sortkey[ idx ]
      # whisper 'Ωhllt_102', ( gold probe_sortkey.sk ), ( red probe_vdx.vdx ), ( lime probe_sortkey.vdx )
      @eq ( Ωhllt_103 = -> probe_sortkey.vdx ), probe_vdx.vdx
    #.......................................................................................................
    return null


#===========================================================================================================
module.exports = do => { test_hollerith, }
