# ddp-servers-test
================

Revised based on https://github.com/camilosw/ddp-servers-test

Server A as Cloud Data Center. 
Server B as Data Source, if some data changed, should be send to Server A. 

## Run 

    cd server-a
    meteor
    
    cd server-b
    meteor --port 3003
    
    
## Insert A <--> B

Server A can insert data on A, and can be subscribed by B

Server B can insert data on B, store on B firstly, then send to A on local added event. 
If connection to A is broken, the data will be stored on B and wait the connection to be restored.
After connection to A is restored, the data on B will send to A automatically. 

Server-A publish data:

    if (Meteor.isServer) {
        Meteor.publish('remote-items', function () {
            return Items.find();
        })
    }

Server-B subscribe remote data on Server A:

    // Connect to Server A
    remote = DDP.connect('http://localhost:3000/');
    ServerAItems = new Meteor.Collection('items', {connection: remote});


    // Subscribe Data on Server A
    remote.subscribe('remote-items');

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
            ...
        });

Server-B subscribe local data and send to Server A:
    
    Items.find().observe({
        added: function (item) {
            console.log('-- local item added--');
            console.log(item);
    
            var _temp = ServerAItems.findOne({_id: item._id});
            if (!_temp) {
                ServerAItems.insert(item);
            }
        },
        ...
    });

## Delete A --> B

Server A can delete all data on A, this delete event can be subscribed by B, and remove all data on B. 

    ServerAItems.find().observe({
            added: function (item) {
                ...
            },
            removed: function (item) {
                console.log('-- remote items removed--');
                Meteor.call('delete');  // delete local data
            }
        });

## Delete A <-//- B

Server B can delete all data on B, BUT does not influence anything on Server A.
 
    Items.find().observe({
        added: function (item) {
            ...
        },
        removed: function (item) {
            console.log('-- local item removed--');
            console.log(item);
        }
    });


## Insert A <-- B, and B only can read data of self 

Server-A publish data:

    if (Meteor.isServer) {
        Meteor.publish('remote-items', function (_author) {
            return Items.find({author:_author});
        })
    }
    
Server B subscribe data of B on A :

    if (Meteor.isServer) {
    
        Meteor.startup(function () {
            Items.remove({});
            remote.subscribe('remote-items', 'B');
        });

## Delete A(B) <-- B

Server-A allow remove:

    Items.allow({
        insert: function () {
            return true;
        },
        remove: function () {
            return true;
        }
    });
    
Remove data of B on A

    Items.find().observe({
            added: function (item) {
                ...
            },
            removed: function (item) {
                console.log('-- local item removed--');
                console.log(item);
        
                ServerAItems.remove({_id:item._id});
            }
        });
        

    