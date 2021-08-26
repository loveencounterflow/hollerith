
# Future of VNR, Datom, Hollerith, Hollerith-Codec, ICQL-DBA-VNR



<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Purpose](#purpose)
- [The Plan](#the-plan)
  - [[+] Retire `hollerith`](#-retire-hollerith)
  - [[+] Retire `hollerith-codec`](#-retire-hollerith-codec)
  - [[–] Init New Major Version of `hollerith`](#-init-new-major-version-of-hollerith)
  - [[–] Re-Publish `icql-dba-vnr` as `icql-dba-hollerith`](#-re-publish-icql-dba-vnr-as-icql-dba-hollerith)
  - [Add benchmarks](#add-benchmarks)
- [Benchmarks](#benchmarks)
  - [`encode()`](#encode)
  - [`sorting`](#sorting)
- [Related](#related)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Purpose

This is a To Do and protocol about the steps involved in refactoring various parts from `hollerith`,
`hollerith-codec`, `datom/vnr`, and `icql-dba-vnr` / `icql-dba-hollerith` (see below for links). The big
picture:

* there's a way to do sequential numbering with integers referring to text file line numbers in such a way
  that arbitrary amounts of new lines obtained from transforming existant lines can be stuffed 'between the
  cracks' in such a way that reference to the original location as well as overall ordering is preserved.
  This technique has been called 'vectorial numbers' (VNRs) and was first implemented as a submodule of
  `datom` with which it is only tangentially related, `datoms` being used as a standard format for chunks of
  data passed through a processing pipeline which would also carry VNRs.

* there's a way to transform lists of integers such that a DB engine like SQLite which is per se not capable
  of ordering lists of integers in a numerical way can deliver such a sorting (SQLite represents JSON values
  as strings and will sort `[1],[10],[100],[2]` instead of `[1],[2],[10],[100]`). This was first implemented
  in `hollerith-codec`.

* [`hollerith`](https://github.com/loveencounterflow/hollerith) was an approach to EAV databases which is no
  longer pursued (it supported an EAV-like 'single/big table' 'phrase' DB for use with key/value stores like
  LevelDB; these efforts have been scrapped in favor of Relational DBs and SQL. The fundamental idea here
  was that one could order values by encoding them using lists of scalar values).

  The name `hollerith` now being free, the next major version will bring together in one package both
  * a much faster re-implementation of `hollerith-codec`-like encodings (serializations), and
  * all the machinery to conveniently work with VNRs (`advance()`, `retract()` and so on).

  To provide the binary representation of such lists,

* [`hollerith-codec`](https://github.com/loveencounterflow/hollerith-codec) was implemented after techniques
  used in [`bytewise`](https://github.com/deanlandolt/bytewise). The faster version that is restricted to
  lists of integers is in
  [`hollerith-codec/tng`](https://github.com/loveencounterflow/hollerith-codec/blob/master/src/tng.coffee)

* [`datom`](https://github.com/loveencounterflow/datom) contains a submodule

* [`datom/vnr`](https://github.com/loveencounterflow/datom/blob/master/src/vnr.coffee) with a class `Vnr`.
  It does not use binary encoding for sorting but a JS `cmp a, b` method (a mthodology which will
  presently not work in SQLite for lack of access from JS to the internal C collation methods).

* `icql-dba-vnr` is a [`icql-dba`](https://github.com/loveencounterflow/icql-dba)
  [plugin](https://github.com/loveencounterflow/icql-dba/blob/master/README-plugins.md) that (e.g.) allows
  to easily add VNR columns to existing tables. It will be renamed `icql-dba-hollerith` to hilite that it
  is, basically, 'Hollerith (VNRs + codec) for SQLite (relational DBs)'. It

  * defines tables and indices to work with VNRs in SQLite,
  * VNR methods inherited from `datom/lib/vnr#Vnr`,
  * and uses `hollerith-codec/tng` for ordering of BLOBs that encode lists of integers.

## The Plan

### [+] Retire `hollerith`

* Its primary use case (EAV-style DBs) has been given up in favor of relation DBs and SQL
* **[+]** rename `hollerith` to `hollerith-legacy`
* **[+]** publish a salutory `hollerith` version (1.2.6) on npm that *includes the new repo URL*,
  https://github.com/loveencounterflow/hollerith-legacy
* address https://github.com/loveencounterflow/hollerith is now free for re-use
* <del>move relevant tests, benchmarks from `hengist/dev/hollerith` to `hengist/dev/hollerith-legacy`</del>
* **[+]** rename `hengist/dev/hollerith-codec` to `hengist/dev/hollerith`

### [+] Retire `hollerith-codec`

* code to be integrated into new `hollerith`
* **[+]** rename `hollerith-codec` to `hollerith-codec-legacy`
* **[+]** publish a salutory `hollerith-codec` version on npm that *includes the new repo URL*,
* **[+]** move relevant tests, benchmarks from `hengist/dev/hollerith-codec` to `hengist/dev/hollerith-codec-legacy`

### [–] Init New Major Version of `hollerith`

* **[–]** move code from `datom/src/vnr` to `hollerith`
* **[–]** publish new major version of `datom` to reflect breaking change
* **[–]** move code from `hollerith-codec-legacy` to `hollerith`
* **[–]** rewrite relevant tests, benchmarks, demos in `hengist/dev/hollerith` based on existing code
* **[–]** publish initial version of `hollerith`

### [–] Re-Publish `icql-dba-vnr` as `icql-dba-hollerith`

* **[–]** deprecate `icql-dba-vnr`
* **[–]** copy code, history to `icql-dba-hollerith`
* **[–]** relocate relevant test, benchmarks, demos in `hengist`
* **[–]** adapt `icql-dba-hollerith` to replace dependency on `hollerith-codec`, `datom/lib/vnr` with dependency
  on `hollerith`

### Add benchmarks

* **[–]** add benchmarks for Hollerith v2 with and without validation
* **[–]** add benchmarks for Hollerith v2 with different sorting methods


## Benchmarks

### `encode()`

```
hollerith_tng       0.236 s    300,000 items     1,269,827⏶Hz             788⏷nspc
hollerith_bcd       2.567 s    300,000 items       116,873⏶Hz           8,556⏷nspc
hollerith_classic   7.302 s    300,000 items        41,087⏶Hz          24,339⏷nspc
charwise            9.924 s    300,000 items        30,231⏶Hz          33,079⏷nspc
bytewise           15.028 s    300,000 items        19,963⏶Hz          50,092⏷nspc
03:05 HENGIST/BENCHMARKS  ▶  hollerith_tng       1,141,367  Hz ≙ 1 ÷ 1.0    100.0 % │████████████▌│
03:05 HENGIST/BENCHMARKS  ▶  hollerith_bcd         115,952  Hz ≙ 1 ÷ 9.8     10.2 % │█▎           │
03:05 HENGIST/BENCHMARKS  ▶  hollerith_classic      40,913  Hz ≙ 1 ÷ 27.9     3.6 % │▌            │
03:05 HENGIST/BENCHMARKS  ▶  charwise               30,099  Hz ≙ 1 ÷ 37.9     2.6 % │▍            │
03:05 HENGIST/BENCHMARKS  ▶  bytewise               19,642  Hz ≙ 1 ÷ 58.1     1.7 % │▎            │
```


* `hollerith-codec/tng` is much faster than the (more generic) encoding used by `charwise` and `bytewise`
* neither of which have a fixed length and would probably have to be padded or otherwise post-processed to
  be used in SQLite sort entries

### `sorting`

```
hollerith2_nv_bcd   0.648 s         300,000 items    462,622⏶Hz             2,162⏷nspc
hollerith2_nv_u32   2.336 s         300,000 items    128,449⏶Hz             7,785⏷nspc
hollerith2_nv_sort  1.647 s         300,000 items    182,197⏶Hz             5,489⏷nspc
00:38 HENGIST/BENCHMARKS  ▶  hollerith2_nv_bcd       463,899  Hz ≙ 1 ÷ 1.0  100.0 % │████████████▌│
00:38 HENGIST/BENCHMARKS  ▶  hollerith2_nv_sort      181,132  Hz ≙ 1 ÷ 2.6   39.0 % │████▉        │
00:38 HENGIST/BENCHMARKS  ▶  hollerith2_nv_u32       124,740  Hz ≙ 1 ÷ 3.7   26.9 % │███▍         │
```

* While the textual `bcd` encoding format is much slower with `encode()`, it delivers texts which are 3
  times as fast than sorting with `buffer.compare()` that is needed for the `u32` format.
* Interestingly, even the current inefficient implementation of `hlr.cmp()` is a bit faster than
  `buffer.compare()`.

## Related

* [`bytewise`](https://github.com/deanlandolt/bytewise), from which ide for the numerical encoding used in
  `hollerith-codec` and `hollerith-codec/tnf` was lifted. This has now been superseded by
  * [`charwise`](https://github.com/dominictarr/charwise) (similar but faster).




