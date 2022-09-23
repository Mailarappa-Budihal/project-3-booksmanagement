const express = require('express')
const router = express.Router();
const userController = require('../controller/userController')
const bookController = require('../controller/bookController')
const reviewController = require('../controller/reviewController')
const middleWare = require('../middleware/auth')

//-------------------register-----------------------------//
router.post('/register', userController.createUser)

//--------------------Loginuser---------------------------//
router.post('/login', userController.loginUser)

//--------------------createbook--------------------------//

router.post('/books', middleWare.authentication, middleWare.authorisation, bookController.createBook)

//--------------------getebookbyquery---------------------//
router.get('/books', middleWare.authentication, bookController.getBooks)

//--------------------getebookbyId------------------------//
router.get('/books/:bookId', middleWare.authentication, bookController.getBookById)

//--------------------updatebook--------------------------//
router.put('/books/:bookId', middleWare.authentication, middleWare.authorisation, bookController.updateBook)

//--------------------deletetebook-------------------------//
router.delete('/books/:bookId', middleWare.authentication, middleWare.authorisation, bookController.deleteBook)

router.post('/books/:bookId/review', reviewController.createReview)

module.exports = router