var tape = require('tape')
var cont = require('cont')
var pull = require('pull-stream')

function all(stream, cb) {
  pull(stream, pull.collect(cb))
}

module.exports = function (opts) {

  tape('retrive messages by type', function (t) {

    var u = require('./util')(opts)

    var dbA = u.createDB('msg-by-type1')
    var alice = dbA.createFeed()


    cont.series([
      alice.add({type: 'foo', foo: 1}),
      alice.add({type: 'bar', bar: 2}),
      alice.add({type: 'foo', foo: 3}),
      alice.add({type: 'bar', bar: 4}),
      alice.add({type: 'baz', baz: 5})
    ]) (function (err) {
      if(err) throw err

      all(dbA.messagesByType({type: 'foo', keys: true}), function (err, ary) {
        if(err) throw err
        t.equal(ary.length, 2)
        t.deepEqual(ary.map(function (e) {
          return e.value.content
        }), [
          {type: 'foo', foo: 1},
          {type: 'foo', foo: 3}
        ])

        var since = ary[1].ts
        
        alice.add({type: 'foo', foo: 6}, function (err) {
          all(dbA.messagesByType({
            type: 'foo',
            keys: true,
            gt: since
          }), function (err, ary) {
            t.equal(ary.length, 1)
            t.deepEqual(ary[0].value.content, {type: 'foo', foo: 6})
            t.end()
          })
        })
      })
    })


  })

}

if(!module.parent)
  module.exports(require('../defaults'))
