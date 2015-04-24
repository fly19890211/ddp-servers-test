Items = new Meteor.Collection('items');

Items.allow({
    insert: function () {
        return true;
    },
    remove: function () {
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
        console.log(item);
    }
});

if (Meteor.isClient) {
    Meteor.subscribe('remote-items');

    Template.testList.events({
        'click a.insert': function (e) {
            e.preventDefault();
            Items.insert({name: new Date() , author: "A"});
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
    Meteor.publish('remote-items', function () {
        return Items.find();
    })

    //Meteor.publish('remote-items', function (_author) {
    //    return Items.find({author:_author});
    //})
}
