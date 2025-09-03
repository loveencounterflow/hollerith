
'use strict'

#===========================================================================================================
SFMODULES                 = require 'bricabrac-single-file-modules'
{ type_of,              } = SFMODULES.unstable.require_type_of()
{ show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
{ debug,                } = console
{ regex,                } = require 'regex'
{ hide,
  set_getter,           } = SFMODULES.require_managed_property_tools()
{ nameit,               } = SFMODULES.require_nameit()
{ clean_assign,         } = SFMODULES.unstable.require_clean_assign()
{ remap,
  omit,                 } = SFMODULES.unstable.require_remap()


# #===========================================================================================================
# ### NOTE Future Single-File Module ###
# class Bounded_list

#   #---------------------------------------------------------------------------------------------------------
#   constructor: ( max_size = 3 ) ->
#     @max_size   = max_size
#     @data       = []
#     return undefined

#   #---------------------------------------------------------------------------------------------------------
#   create: ( P... ) ->
#     @data.push clean_assign {}, P...
#     @data.shift() if @size > @max_size
#     return @current

#   #---------------------------------------------------------------------------------------------------------
#   assign: ( P...  ) -> clean_assign @current, P...
#   at:     ( idx   ) -> @data.at idx

#   #---------------------------------------------------------------------------------------------------------
#   set_getter @::, 'size',     -> @data.length
#   set_getter @::, 'is_empty', -> @data.length is 0
#   set_getter @::, 'current',  -> if @is_empty then @create() else @at -1


#===========================================================================================================
### NOTE Future Single-File Module ###
class Type

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace, name, isa ) ->
    hide @, 'name',   name
    hide @, 'T',      typespace
    hide @, '_isa',   isa
    @data           = {} # new Bounded_list()
    return undefined

  #---------------------------------------------------------------------------------------------------------
  isa: ( x ) ->
    # try
    #   ( new Test guytest_cfg ).test { types: @hollerith.types, }
    # finally
    #   debug 'Ωhllt___1', "error"
    @data = {}; R = @_isa.call @, x
    return R

  #---------------------------------------------------------------------------------------------------------
  isame: ( caller, mapping, x ) ->
    # try
    #   ( new Test guytest_cfg ).test { types: @hollerith.types, }
    # finally
    #   debug 'Ωhllt___2', "error"
    switch arity = arguments.length
      when 2
        [ caller, mapping, x, ] = [ caller, null, mapping, ]
        R                       = @_isa.call caller, x
      when 3
        original_data           = caller.data
        caller.data             = Object.assign {}, caller.data
        R                       = @_isa.call caller, x
        caller.data             = Object.assign original_data, ( remap caller.data, mapping )
      else
        throw new Error "Ωbsk___3 expected 2 or 3 arguments, got #{arity}"
    return R

  #---------------------------------------------------------------------------------------------------------
  isa2: ( x, data = null, mapping = null ) ->
    # try
    @data   = {}
    R       = @_isa.call @, x
    #.......................................................................................................
    if data?
      if mapping?     then  clean_assign data, ( remap ( clean_assign {}, @data ), mapping )  ### d1 m1 ###
      else                  clean_assign data, @data                                          ### d1 m0 ###
    else if mapping?  then  remap @data, mapping                                              ### d0 m1 ###
    return R                                                                                  ### d0 m0 ###
    # finally


  #---------------------------------------------------------------------------------------------------------
  assign: ( P... ) -> clean_assign @data, P...

  #---------------------------------------------------------------------------------------------------------
  fail: ( message, P... ) -> clean_assign @data, { message, }, P...; false


#===========================================================================================================
class Typespace

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    clasz = @constructor
    for name in Object.getOwnPropertyNames clasz
      class Typeclass extends Type
      nameit name, Typeclass
      @[ name ] = new Typeclass @, name, isa = clasz[ name ]
    return undefined


############################################################################################################
# HOLLERITH TYPESPACE
#===========================================================================================================
class Hollerith_typespace extends Typespace

  #=========================================================================================================
  @text:           ( x ) -> ( type_of x ) is 'text'
  @nonempty_text:  ( x ) -> ( @T.text.isa x ) and x.length > 0
  @float:          ( x ) -> Number.isFinite x
  @integer:        ( x ) -> Number.isSafeInteger x
  @pinteger:       ( x ) -> ( @T.integer.isa x ) and x > 0
  @zpinteger:      ( x ) -> ( @T.integer.isa x ) and x >= 0
  @cardinal:       ( x ) -> @T.zpinteger.isa x
  #---------------------------------------------------------------------------------------------------------
  @dimension:      ( x ) -> @T.pinteger.isa  x

  #---------------------------------------------------------------------------------------------------------
  @incremental_text: ( x ) ->
    return false unless @T.text.isa x
    # @assign { iam: 'incremental_text', }
    @assign { chrs: ( Array.from x ), }
    debug 'Ωbsk___5', @data
    return _test_monotony.call @, x, '<'

  #---------------------------------------------------------------------------------------------------------
  @decremental_text: ( x ) ->
    return false unless @T.text.isa x
    @assign { chrs: ( Array.from x ), }
    return _test_monotony.call @, x, '>'

  #---------------------------------------------------------------------------------------------------------
  @nmag_bare_reversed:  ( x ) -> @T.incremental_text.isame @, x
  @pmag_bare:           ( x ) -> @T.incremental_text.isame @, x

  #---------------------------------------------------------------------------------------------------------
  @magnifiers: ( x ) ->
    return ( @fail "expected a magnifier, got an empty text" ) unless @T.nonempty_text.isa x
    [ nmag_bare_reversed,
      pmag_bare,  ] = x.split /\s+/v
    #.......................................................................................................
    # @assign { iam: 'magnifiers', }; debug 'Ωbsk___6', @data
    return ( @fail "???" ) unless  @T.nmag_bare_reversed.isame  @, { chrs: 'nmag_chrs', }, nmag_bare_reversed
    return ( @fail "???" ) unless  @T.pmag_bare.isame           @, { chrs: 'pmag_chrs', }, pmag_bare
    #.......................................................................................................
    nmag            = ' ' + nmag_bare_reversed.reverse()
    pmag            = ' ' + pmag_bare
    @assign { nmag, pmag, }
    return true


#===========================================================================================================
_test_monotony = ( x, cmp ) ->
  { chrs, } = @data # = @create data
  return ( @fail "empty is not monotonic" ) if chrs.length is 0
  return true   if chrs.length is 1
  for idx in [ 1 ... chrs.length ]
    prv_chr = chrs[ idx - 1 ]
    chr     = chrs[ idx     ]
    R       = switch cmp
      when '>' then prv_chr > chr
      when '<' then prv_chr < chr
      else throw new Error "Ωbsk___7 (internal) expected '>' or '<', got #{rpr cmp}"
    continue if R
    @assign { fail: { x, idx, prv_chr, chr, }, }
    return false
  return true

#===========================================================================================================
Object.assign module.exports,
  types:      new Hollerith_typespace()
  internals: {
    Type
    Typespace
    Hollerith_typespace
    # Bounded_list
    }
