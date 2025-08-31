
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


#===========================================================================================================
class Type

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace, name, isa ) ->
    hide @, 'name',   name
    hide @, 'T',      typespace
    hide @, '_isa',   isa
    hide @, '_ctx',   Object.create typespace
    @_ctx.me        = @
    @data           = {}
    return undefined

  #---------------------------------------------------------------------------------------------------------
  isa: ( P... ) -> @_isa.call @_ctx, P...


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

  #=========================================================================================================
  @text:           ( x ) -> ( type_of x ) is 'text'
  @nonempty_text:  ( x ) -> ( @text.isa x ) and x.length > 0
  @float:          ( x ) -> Number.isFinite x
  @integer:        ( x ) -> Number.isSafeInteger x
  @pinteger:       ( x ) -> ( @integer.isa x ) and x > 0
  @zpinteger:      ( x ) -> ( @integer.isa x ) and x >= 0
  @cardinal:       ( x ) -> @zpinteger.isa x

  #---------------------------------------------------------------------------------------------------------
  @moninc_chrs: ( x ) ->
    return false unless @nonempty_text x
    @data.chrs = chrs = Array.split x
    prv_chr    = null
    for chr, idx in chrs
      continue unless prv_chr?
      return false unless prv_chr < chr
      prv_chr = chr
    return true

  #---------------------------------------------------------------------------------------------------------
  @dimension:      ( x ) -> @pinteger.isa  x

  #---------------------------------------------------------------------------------------------------------
  @nmag_bare_reversed: ( x ) ->
    return false unless @nonempty_text x
  #---------------------------------------------------------------------------------------------------------
  @pmag_bare: ( x ) ->

  #---------------------------------------------------------------------------------------------------------
  @magnifiers: ( x ) ->
    return false unless @nonempty_text.isa x
    [ nmag_bare_reversed,
      pmag_bare,  ] = x.split /\s+/
    return false unless @nmag_bare_reversed  nmag_bare_reversed
    return false unless @pmag_bare           pmag_bare
    nmag            = ' ' + nmag_bare_reversed.reverse()
    pmag            = ' ' + pmag_bare


#===========================================================================================================
module.exports = { types: new Typespace(), internals: { Type, Typespace, }, }
