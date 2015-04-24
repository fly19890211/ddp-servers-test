Items = new Meteor.Collection('items');

remote = DDP.connect('http://localhost:3000/');
ServerAItems = new Meteor.Collection('items', {connection: remote});

Items.allow({
    insert: function () {
        return true;
    }
});

Meteor.methods({
    delete: function () {
        Items.remove({});
    }
});

Items.find().observe({
    added: function (item) {
        console.log('-- local item added--');
        console.log(item);

        var _temp = ServerAItems.findOne({_id: item._id});
        if (!_temp) {
            ServerAItems.insert(item);
        }
    },
    removed: function (item) {
        console.log('-- local item removed--');
        console.log(item);

        ServerAItems.remove({_id:item._id});
    }
});

if (Meteor.isClient) {
    Meteor.subscribe('local-items');

    Template.testList.events({
        'click a.insert': function (e) {
            e.preventDefault();
            Items.insert({name: new Date(), author: "B"});
        },
        'click a.delete': function (e) {
            e.preventDefault();
            Meteor.call('delete');
        }
    });

    Template.testList.helpers({
        tests: function () {
            return Items.find();
        }
    });
}

if (Meteor.isServer) {

    Meteor.startup(function () {
        Items.remove({});
        //remote.subscribe('remote-items', 'B');
        remote.subscribe('remote-items');
    });

    ServerAItems.find().observe({
        added: function (item) {
            console.log('-- remote item added--');
            console.log(item);

            var _temp = Items.findOne({_id: item._id});
            if (!_temp) {
                console.log('-- local insert--');
                Items.insert(item);
            }
        },
        removed: function (item) {
            console.log('-- remote items removed--');
            Meteor.call('delete');
        }
    });

    Meteor.publish('local-items', function () {
        return Items.find();
    })
}
