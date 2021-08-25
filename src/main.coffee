

'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'HOLLERITH'
debug                     = CND.get_logger 'debug',     badge
warn                      = CND.get_logger 'warn',      badge
info                      = CND.get_logger 'info',      badge
urge                      = CND.get_logger 'urge',      badge
help                      = CND.get_logger 'help',      badge
whisper                   = CND.get_logger 'whisper',   badge
echo                      = CND.echo.bind CND
{ jr
  assign }                = CND
{ lets
  freeze }                = require 'letsfreezethat'


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
C = freeze
  u32_sign_delta:   0x80000000  ### used to lift negative numbers to non-negative                        ###
  u32_width:        4           ### bytes per element                                                    ###
  u32_nr_min:       -0x80000000 ### smallest possible VNR element                                        ###
  u32_nr_max:       +0x7fffffff ### largest possible VNR element                                         ###
  #.........................................................................................................
  bcd_dpe:          4           ### digits per element                                                   ###
  bcd_base:         36          ### number base                                                          ###
  bcd_plus:         '+'         ### plus symbol, should sort after bcd_minus                             ###
  bcd_minus:        '!'         ### minus symbol, should sort before bcd_plus                            ###
  bcd_padder:       '.'         ### used to pad empty fields                                             ###
  bcd_nr_max:       parseInt '+zzzz', 36
  bcd_nr_min:       parseInt '-zzzz', 36
  #.........................................................................................................
  defaults:
    hlr_constructor_cfg:
      vnr_width:    5           ### maximum elements in VNR vector ###
      validate:     false
      # autoextend: false
      format:       'u32'

#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
create_types = ( instance ) ->
  types = new ( require 'intertype' ).Intertype()

  #-----------------------------------------------------------------------------------------------------------
  types.declare 'hlr_constructor_cfg', tests:
    "x is a object":                    ( x ) -> @isa.object x
    "@isa.cardinal x.vnr_width":        ( x ) -> @isa.cardinal x.vnr_width
    "@isa.boolean x.validate":          ( x ) -> @isa.boolean x.validate
    "x.format in [ 'u32', 'bcd', ]":    ( x ) -> x.format in [ 'u32', 'bcd', ]
  types.validate.hlr_constructor_cfg instance.cfg

  #-----------------------------------------------------------------------------------------------------------
  types.declare 'hlr_vnr', ( x ) ->
    ### TAINT check bounds of elements ###
    return false unless @isa.nonempty_list x
    return x.every ( xx ) => @isa.positive_integer xx

  #-----------------------------------------------------------------------------------------------------------
  return types

#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
### TAINT use separate class? for validation to eschew extra call on each use ###
class @Hollerith

  #---------------------------------------------------------------------------------------------------------
  @C: C

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    @cfg    = { C.defaults.hlr_constructor_cfg..., cfg..., }
    @types  = create_types @
    @cfg    = freeze @cfg
    @encode = switch @cfg.format
      when 'u32' then @_encode_u32
      when 'bcd' then @_encode_bcd
    return undefined


  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  _encode_u32: ( vnr ) =>
    ### Observe that we limit all VNR elements to `[ u32_nr_max .. u32_nr_min ]` so numbers outside that
    range will no longer cause an error. Clients will have to check for boundaries somewhere else if they
    so wish. ###
    @types.validate.vnr vnr if @cfg.validate
    unless 0 < vnr.length <= @cfg.vnr_width
      throw new Error "^44798^ expected VNR to be between 1 and #{@cfg.vnr_width} elements long, got length #{vnr.length}"
    R       = Buffer.alloc @cfg.vnr_width * C.u32_width, 0x00 ### TAINT pre-compute constant ###
    offset  = -C.u32_width
    for idx in [ 0 ... @cfg.vnr_width ]
      nr = vnr[ idx ] ? 0
      nr = Math.min nr, @constructor.C.u32_nr_max
      nr = Math.max nr, @constructor.C.u32_nr_min
      R.writeUInt32BE nr + C.u32_sign_delta, ( offset += C.u32_width )
    return R

  #---------------------------------------------------------------------------------------------------------
  _encode_bcd: ( vnr ) =>
    R           = []
    for idx in [ 0 ... @cfg.vnr_width ]
      nr    = vnr[ idx ] ? 0
      sign  = if nr >= 0 then C.bcd_plus else C.bcd_minus
      nr    = Math.min nr, @constructor.C.bcd_nr_max
      nr    = Math.max nr, @constructor.C.bcd_nr_min
      R.push sign + ( ( Math.abs nr ).toString C.bcd_base ).padStart C.bcd_dpe, C.bcd_padder
    return R.join ','


  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  create: ( source = null ) =>
    return [ 0, ] unless source?
    @types.validate.vnr source if @cfg.validate
    return [ source..., ]

  #---------------------------------------------------------------------------------------------------------
  deepen: ( vnr, nr = 0 ) =>
    ### Given a vectorial line number `vnr`, return a copy of `vnr`, call it
    `vnr0`, which has an index of `0` appended, thus representing the pre-first `vnr` for a level of lines
    derived from the one that the original `vnr` pointed to. ###
    @types.validate.vnr vnr if @cfg.validate
    return [ vnr..., nr, ]

  #---------------------------------------------------------------------------------------------------------
  advance:  ( vnr ) => @move vnr, +1
  recede:   ( vnr ) => @move vnr, -1

  #---------------------------------------------------------------------------------------------------------
  move: ( vnr, delta ) =>
    ### Given a vectorial line number `vnr`, return a copy of `vnr`, call it
    `vnr0`, which has its last index incremented by `1`, thus representing the vectorial line number of the
    next line in the same level that is derived from the same line as its predecessor. ###
    if @cfg.validate
      @types.validate.vnr vnr
      @types.validate.integer delta
    R                   = [ vnr..., ]
    R[ vnr.length - 1 ]  += delta
    return R


  #=========================================================================================================
  # SORTING
  #---------------------------------------------------------------------------------------------------------
  ### TAINT conflate _only_zeroes_after(), _first_nonzero_is_negative() ###
  _only_zeroes_after: ( list, first_idx ) =>
    for idx in [ first_idx ... list.length ]
      return false  if list[ idx ] isnt 0
    return true

  #---------------------------------------------------------------------------------------------------------
  _first_nonzero_is_negative: ( list, first_idx ) =>
    idx = first_idx
    loop
      if ( R = list[ idx ] ) is 0
        idx++
        continue
      return false if ( R is undefined ) or ( R > 0 )
      return true

  #---------------------------------------------------------------------------------------------------------
  cmp_blobs: ( a, b ) => a.compare b

  #---------------------------------------------------------------------------------------------------------
  cmp: ( a, b ) =>
    if @cfg.validate
      @types.validate.vnr a
      @types.validate.vnr b
    a_length  = a.length
    b_length  = b.length
    min_idx   = ( Math.min a_length, b_length ) - 1
    for idx in [ 0 .. min_idx ]
      ai = a[ idx ]
      bi = b[ idx ]
      return -1 if ai < bi
      return +1 if ai > bi
    return  0 if a_length is b_length
    if a_length < b_length
      return 0  if @_only_zeroes_after          b, min_idx + 1
      return +1 if @_first_nonzero_is_negative  b, min_idx + 1
      return -1
    return 0  if @_only_zeroes_after          a, min_idx + 1
    return -1 if @_first_nonzero_is_negative  a, min_idx + 1
    return +1

  #---------------------------------------------------------------------------------------------------------
  sort_blobs: ( vnr_blobs ) =>
    ### Given a list of VNRs, return a copy of the list with the VNRs lexicographically sorted. ###
    if @cfg.validate
      @types.validate.list vnr_blobs
    return [ vnr_blobs..., ].sort ( a, b ) => a.compare b

  #---------------------------------------------------------------------------------------------------------
  sort: ( vnrs ) =>
    ### Given a list of VNRs, return a copy of the list with the VNRs lexicographically sorted. ###
    if @cfg.validate
      @types.validate.list vnrs
    return [ vnrs..., ].sort @cmp


#===========================================================================================================
@Hollerith  = freeze @Hollerith
@HOLLERITH  = new @Hollerith()


