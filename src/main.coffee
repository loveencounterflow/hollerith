

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
  sign_delta:   0x80000000  ### used to lift negative numbers to non-negative ###
  u32_width:    4           ### bytes per element ###
  nr_min:       -0x80000000 ### smallest possible VNR element ###
  nr_max:       +0x7fffffff ### largest possible VNR element ###
  #.........................................................................................................
  defaults:
    hlr_constructor_cfg:
      vnr_width:    5           ### maximum elements in VNR vector ###
      validate:     false
      # autoextend: false


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
    return undefined


  #=========================================================================================================
  #
  #---------------------------------------------------------------------------------------------------------
  encode: ( vnr ) ->
    @types.validate.vnr vnr if @cfg.validate
    unless 0 < vnr.length <= @cfg.vnr_width
      throw new Error "^44798^ expected VNR to be between 1 and #{@cfg.vnr_width} elements long, got length #{vnr.length}"
    R       = Buffer.alloc @cfg.vnr_width * C.u32_width, 0x00 ### TAINT pre-compute constant ###
    offset  = -C.u32_width
    for idx in [ 0 ... @cfg.vnr_width ]
      R.writeUInt32BE ( vnr[ idx ] ? 0 ) + C.sign_delta, ( offset += C.u32_width )
    return R

  #---------------------------------------------------------------------------------------------------------
  _encode_bcd: ( vnr ) ->
    dpe         = 4           ### digits per element ###
    base        = 36
    plus        = '+'
    minus       = '!'
    padder      = '.'
    R           = []
    for idx in [ 0 ... @cfg.vnr_width ]
      nr    = vnr[ idx ] ? 0
      sign  = if nr >= 0 then plus else minus
      R.push sign + ( ( Math.abs nr ).toString base ).padStart dpe, padder
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
      return +1 if @_first_nonzero_is_negative b, min_idx + 1
      return -1
    return -1 if @_first_nonzero_is_negative a, min_idx + 1
    return +1

  #---------------------------------------------------------------------------------------------------------
  sort: ( vnrs ) =>
    ### Given a list of VNRs, return a copy of the list with the VNRs lexicographically sorted. ###
    if @cfg.validate
      @types.validate.list vnrs
    return [ vnrs..., ].sort @cmp


#===========================================================================================================
@Hollerith  = freeze @Hollerith
@HOLLERITH  = new @Hollerith()


