const { default: mongoose } = require('mongoose');
const reviewModel = require('../models/reviewModel');
const bookModel = require('../models/bookModel');
const ObjectId = mongoose.Types.ObjectId;
const validator = require('../validators/validator')


//----------------------------createReview----------------------------------------//
const createReview = async function(req, res) {
    let bId = req.params.bookId;
    let data = req.body;
    let { review, rating, reviewedBy } = data;

    //----------------validatingBookId------------------------//
    if (!ObjectId.isValid(bId.trim())) return res.status(400).send({ status: false, msg: "Invalid Book id in path params,book id shouls be of 24 digits" })

    let checkBook = await bookModel.findById(bId)
    if (!checkBook) return res.status(404).send({ status: false, msg: "No book found for this book id!!" })

    if (checkBook.isDeleted == true) return res.status(400).send({ status: false, msg: "Cann't create review for this book as it is already deleted!" })

    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, msg: "Invalid parameters! Please provide data in request body to create review" })

    //----------------validatingReview------------------------//
    if (review) {
        if (!validator.isValid(review)) return res.status(400).send({ status: false, msg: "Review is required and should be a valid string" })
    }

    //----------------validatingrating------------------------//
    if (!validator.isValid(rating)) return res.status(400).send({ status: false, msg: "Rating is mandatory and should be a valid integer value" })

    const rat = /^[1-5]$/.test(rating)
    if (rat == false) return res.status(400).send({ status: false, msg: "Rating should be in between 1 to 5" })

    //----------------validatingreviewedBy------------------------//
    if (reviewedBy) {
        if (!validator.isValid(reviewedBy)) return res.status(400).send({ status: false, msg: "Reviewd by value should be present and a valid string" })
    }
    data['bookId'] = checkBook._id;
    data['reviewedAt'] = new Date();

    //----------------creatingReview------------------------//

    const saveReview = await reviewModel.create(data)
    if (saveReview) {
        await bookModel.findOneAndUpdate({ _id: bId }, { $inc: { reviews: 1 } }, { new: true })
    }
    const response = await reviewModel.findById({ _id: saveReview._id }).select({ __v: 0, isDeleted: 0 })

    //-------------------addingReviewtoBook------------------//
    const final = checkBook.toObject();
    final['reviewsData'] = response;

    return res.status(201).send({ status: false, msg: "Reviews added successfully for the given book", data: final })

}

//-----------------------------------updateReview---------------------------------------------//
const updateReview = async function(req, res) {
    let bId = req.params.bookId;
    let rId = req.params.reviewId;
    let data = req.body;
    let { review, rating, reviewedBy } = data;
    let obj = {}

    //----------------validatingBookId------------------------//
    if (!ObjectId.isValid(bId.trim())) return res.status(400).send({ status: false, msg: "Invalid Book id in path params,book id shouls be of 24 digits" })

    let checkBook = await bookModel.findById(bId)
    if (!checkBook) return res.status(404).send({ status: false, msg: "No book found for this book id!!" })

    if (checkBook.isDeleted == true) return res.status(400).send({ status: false, msg: "Cann't update review for this book as it is already deleted!" })

    if (!ObjectId.isValid(rId.trim())) return res.status(400).send({ status: false, msg: "Invalid review id in path params,review id should be of 24 digits" })


    //----------------validatingReview------------------------//
    let checkReview = await reviewModel.findById(rId)
    if (!checkReview) return res.status(404).send({ status: false, msg: "No review found for this book id!!" })

    if (checkReview.isDeleted == true) return res.status(400).send({ status: false, msg: "Cann't update review for this book as it is already deleted!" })

    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, msg: "Invalid parameters! Please provide data in request body to update review" })


    //----------------validatingReview------------------------//
    if (review) {
        if (!validator.isValid(review)) return res.status(400).send({ status: false, msg: "Review is required and should be a valid string" })
        obj['review'] = review;
    }
    //----------------validatingrating------------------------//

    if (rating) {
        if (!validator.isValid(rating)) return res.status(400).send({ status: false, msg: "Rating is mandatory and should be a valid integer value" })

        const rat = /^[1-5]$/.test(rating)
        if (rat == false) return res.status(400).send({ status: false, msg: "Rating should be in between 1 to 5" })
        obj['rating'] = rating;
    }

    //----------------validatingreviewedBy------------------------//
    if (reviewedBy) {
        if (!validator.isValid(reviewedBy)) return res.status(400).send({ status: false, msg: "Reviewd by value should be present and a valid string" })
        obj['reviewedBy'] = reviewedBy;
    }

    //----------------updatingReview------------------------//
    let updatedReview = await reviewModel.findByIdAndUpdate({ _id: rId }, { $set: obj }, { new: true }).select({ __v: 0, isDeleted: 0 })

    //----------------updatingReviewinbook------------------------//
    let final = checkBook.toObject()
    final['reviewsData'] = updatedReview;

    return res.status(200).send({ status: true, msg: "Review updated successfully!", data: final })


}

//--------------------------------deleteReview-------------------------------------------//
const deleteReview = async function(req, res) {
    let bId = req.params.bookId;
    let rId = req.params.reviewId;

    //----------------validatingBookId------------------------//
    if (!ObjectId.isValid(bId.trim())) return res.status(400).send({ status: false, msg: "Invalid Book id in path params,book id shouls be of 24 digits" })

    let checkBook = await bookModel.findById(bId)
    if (!checkBook) return res.status(404).send({ status: false, msg: "No book found for this book id!!" })

    if (checkBook.isDeleted == true) return res.status(400).send({ status: false, msg: "Cann't delete review for this book as book is already deleted!" })

    //----------------validatingReviewId------------------------//
    if (!ObjectId.isValid(rId.trim())) return res.status(400).send({ status: false, msg: "Invalid review id in path params,review id should be of 24 digits" })

    let checkReview = await reviewModel.findOne({ _id: rId, bookId: bId })
    if (!checkReview) return res.status(404).send({ status: false, msg: "No review found for the given book Id!!" })

    if (checkReview.isDeleted == true) return res.status(400).send({ status: false, msg: "Cann't delete review as it is already deleted!" })

    //----------------deletingReview------------------------//
    const deletedReview = await reviewModel.findByIdAndUpdate({ _id: rId }, { isDeleted: true }, { new: true })

    //----------------decresing Reviewcount in book------------------------//
    if (deletedReview) {
        await bookModel.findByIdAndUpdate({ _id: bId }, { $inc: { reviews: -1 } }, { new: true })
    }
    return res.status(200).send({ status: false, msg: "Reviews deleted Successfully!!", data: deletedReview })
}


module.exports = { createReview, updateReview, deleteReview };