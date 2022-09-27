const mongoose = require("mongoose");
const bookModel = require("../models/bookModel");
const userModel = require("../models/userModel");
const validator = require("../validators/validator");
const ObjectId = mongoose.Types.ObjectId;
const moment = require("moment");

//---------------------------------createBook-------------------------------------//

const createBook = async function(req, res) {
    try {
        let data = req.body;
        let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } =
        data;

        //-----------------------validationReqBody------------------------------------//
        if (Object.keys(data).length == 0)
            return res.status(400).send({
                status: false,
                msg: "Request body cannot be empty,please provide book  details to create book",
            });

        //---------------------------Validation for title-------------------------------------//

        if (!validator.isValid(title))
            return res.status(400).send({
                status: false,
                msg: "Title is Mandatory",
            });

        //---------------------------Validation for excerpt-----------------------------------//
        if (!validator.isValid(excerpt))
            return res.status(400).send({
                status: false,
                msg: "Excerpt is Mandatory",
            });

        //------------------------validation for userId--------------------------------//
        if (!validator.isValid(userId))
            return res
                .status(400)
                .send({ status: false, msg: "User Id is Mandatory" });

        if (!ObjectId.isValid(userId.trim()))
            return res
                .status(400)
                .send({
                    status: false,
                    msg: "userId is not valid,should be of 24 digits",
                });

        const userToCreateBook = await userModel.findById(userId);
        if (!userToCreateBook)
            return res
                .status(404)
                .send({
                    status: false,
                    msg: `No such user present with ${userId}`,
                });

        //---------------------------Validation for ISBN-------------------------------------//
        if (!validator.isValid(ISBN))
            return res.status(400).send({
                status: false,
                msg: "ISBN is Mandatory",
            });

        const isb = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(ISBN); //check for format of ISBN
        if (isb == false)
            return res.status(400).send({
                status: false,
                msg: "ISBN should of 13 digits and only hyphens allowed with digits",
            });
        //-------------------------Validation for category----------------------------------//

        if (!validator.isValid(category))
            return res.status(400).send({
                status: false,
                msg: "Category is Mandatory",
            });

        //-----------------------Validation for subcategory-------------------------------//
        if (!validator.isValid(subcategory))
            return res.status(400).send({
                status: false,
                msg: "Sub-Category  is Mandatory",
            });

        //-------------------------Validation for releasedAt---------------------------------//
        if (!validator.isValid(releasedAt))
            return res.status(400).send({
                status: false,
                msg: "ReleasedAt is Mandatory",
            });

        var date = moment(releasedAt, "YYYY-MM-DD", true).isValid();
        if (!date)
            return res.status(400).send({
                status: false,
                msg: "format of date is wrong,correct fromat is YYYY-MM-DD",
            });

        //-------------------------Validation for Duplication----------------------------//
        let dupTitle = await bookModel.findOne({ title: title });
        if (dupTitle)
            return res
                .status(400)
                .send({ status: false, msg: `Book title ${title} is already in use` });

        let dupISBN = await bookModel.findOne({ ISBN: ISBN });
        if (dupISBN)
            return res
                .status(400)
                .send({ status: false, msg: `ISBN ${ISBN} is already in use` });

        //---------------------------Bookcreation------------------------------------//
        const bookCreated = await bookModel.create(data);
        return res
            .status(201)
            .send({ status: true, message: "Success", data: bookCreated });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
}; //function ends here

//-----------------------------------getBooksByQuery--------------------------------------//

const getBooks = async function(req, res) {
    try {
        let data = req.query;
        let { userId, category, subcategory } = data;
        let filterQuery = { isDeleted: false };

        if (Object.keys(data).length > 0) {
            if (userId && userId.trim() !== "") {
                if (!ObjectId.isValid(userId))
                    return res.status(400).send({
                        status: false,
                        msg: "UserId is not valid it should be of 24 digits",
                    });
                filterQuery.userId = userId.trim();
            }
            if (category && category.trim() !== "") {
                filterQuery.category = category.trim();
            }
            if (subcategory && subcategory.trim() !== "") {
                filterQuery.subcategory = subcategory.trim();
            }

            const result = await bookModel
                .find(filterQuery)
                .select({
                    deletedAt: 0,
                    subcategory: 0,
                    ISBN: 0,
                    isDeleted: 0,
                    updatedAt: 0,
                    createdAt: 0,
                    __v: 0,
                })
                .sort({ title: 1 });
            if (result.length === 0)
                return res
                    .status(404)
                    .send({ status: false, msg: "No books found for applied filter" });

            return res
                .status(200)
                .send({ status: true, message: "Books list", data: result });
        } else {
            let result = await bookModel
                .find({ isDeleted: false })
                .select({
                    deletedAt: 0,
                    subcategory: 0,
                    ISBN: 0,
                    isDeleted: 0,
                    updatedAt: 0,
                    createdAt: 0,
                    __v: 0,
                })
                .sort({ title: 1 });
            if (result.length === 0)
                return res.status(404).send({ status: false, msg: "no books found" });

            return res
                .status(200)
                .send({ status: true, message: "Books list", data: result });
        }
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};
//main function scope ends here

//-----------------------------------getBooksById--------------------------------------//
const getBookById = async function(req, res) {
    try {
        let bId = req.params.bookId;

        //-----------------------validation for BookId------------------------------------//
        if (!ObjectId.isValid(bId))
            return res.status(400).send({
                status: false,
                msg: "Please enter valid Book Id,it should be of 24 digits",
            });

        const result = await bookModel.findOne({ _id: bId, isDeleted: false });

        if (!result)
            return res
                .status(404)
                .send({ status: false, msg: `No book found for this ${bId} book Id` });
        let review = [];
        let obj = result.toObject();
        obj["reviewsData"] = review;

        return res.status(200).send({ status: true, message: "Books list", data: obj });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};
//---------------------------updateBook-------------------------------------//
const updateBook = async function(req, res) {
    try {
        let bId = req.params.bookId;
        let data = req.body;
        let { title, excerpt, releasedAt, ISBN } = data;
        //-----------------------validation for BookId-----------------------------------//
        if (!ObjectId.isValid(bId))
            return res.status(400).send({
                status: false,
                msg: "Please enter valid Book Id,it should be of 24 digits!!",
            });

        let checkBook = await bookModel.findOne({ _id: bId, isDeleted: false });
        if (!checkBook)
            return res.status(404).send({
                status: false,
                msg: "No book present with this book Id or is already deleted!",
            });

        //-----------------------validation for ReqBody------------------------------------//
        if (Object.keys(data).length == 0)
            return res.status(400).send({
                status: false,
                msg: "Request body cann't be empty while updating",
            });

        //-----------------------validation for ReqBody------------------------------------//

        if (title) { if (!validator.isValid(title)) return res.status(400).send({ status: false, msg: "Title is required and should be a valid string" }) }

        if (excerpt) { if (!validator.isValid(excerpt)) return res.status(400).send({ status: false, msg: "Excerpt is required and should be a valid string" }) }

        if (ISBN) {
            if (!validator.isValid(ISBN)) return res.status(400).send({ status: false, msg: "ISBN is required and should be a valid string" })

            const isb = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(ISBN) //check for format of ISBN
            if (isb == false) return res.status(400).send({ status: false, msg: "ISBN should of 13 digits and only hyphens allowed with digits" })
        }

        if (releasedAt) {
            if (!validator.isValid(releasedAt)) return res.status(400).send({ status: false, msg: "ReleasedAt is required and should be a valid string" })

            var date = moment(releasedAt, 'YYYY-MM-DD', true).isValid()
            if (!date) return res.status(400).send({ status: false, msg: "format of date is wrong,correct fromat is YYYY-MM-DD" })
        }

        //--------------checking for uniqueness--------------------------------//
        let dupTitle = await bookModel.findOne({ title: title });
        if (dupTitle)
            return res
                .status(400)
                .send({ status: false, msg: `Book title ${title} is already in use` });

        let dupISBN = await bookModel.findOne({ ISBN: ISBN });
        if (dupISBN)
            return res
                .status(400)
                .send({ status: false, msg: `ISBN ${ISBN} is already in use` });

        //-----------------------------updating the Book------------------------------//

        let updatedBook = await bookModel.findOneAndUpdate({ _id: bId }, { title: title, excerpt: excerpt, ISBN: ISBN, releasedAt: releasedAt }, { new: true });
        return res
            .status(200)
            .send({ status: true, message: "success", data: updatedBook });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};

//----------------------------------deleteBook----------------------------------------//
const deleteBook = async function(req, res) {
    try {
        let bId = req.params.bookId;

        //-----------------------validation for bookId------------------------------------//
        if (!ObjectId.isValid(bId))
            return res.status(400).send({
                status: false,
                msg: "Please enter valid Book Id,it should be of 24 digits!",
            });

        let checkBook = await bookModel.findOne({ _id: bId, isDeleted: false });
        if (!checkBook)
            return res.status(404).send({
                status: false,
                msg: "No book present with this book Id or is already deleted + 1",
            });

        //----------------------- deleting the book------------------------------------//
        await bookModel.findOneAndUpdate({ _id: bId }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        return res
            .status(200)
            .send({ status: true, message: "Book deleted successfully!!" });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};

module.exports = { createBook, getBookById, getBooks, updateBook, deleteBook };