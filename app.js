//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//  step 1 database connect
mongoose.connect("mongodb+srv://admin:123@cluster0-pyixk.mongodb.net/todolistDB", { useNewUrlParser: true });

// step 2 : create schema    
const itemsSchema = {
  name: String
};

//step 3 : create mongoose model (model should be Capital) sigular name
const Item = mongoose.model("Item", itemsSchema);

//added the deafult items
const item1 = new Item({
  name: "welcome to your todolist "
});

const item2 = new Item({
  name: "Hit the + button to aff a new lines"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItem = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);
//


app.get("/", function (req, res) {

  Item.find({}, function (err, fountItem) {
    if (fountItem.length === 0) {
      Item.insertMany(defaultItem, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("added the items to list")
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: fountItem });
    }
  });

});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundlist) {
    if (!err) {
      if (!foundlist) {
        // crate new list
        const list = new List({
          name: customListName,
          items: defaultItem
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show existing list
        res.render("list", { listTitle: foundlist.name, newListItems: foundlist.items });
      }
    }
  });

});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundlist) {
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function (req, res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkItemId, function (err) {
      if (err) {
        console.log("error are there");
      } else {
        console.log("succesully remove");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkItemId } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
