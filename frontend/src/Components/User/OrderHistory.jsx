import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Modal,
  TextField
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import Rating from '@mui/material/Rating';
import axios from 'axios';
import { auth } from '../../firebaseConfig';
import Swal from 'sweetalert2';

const OrderHistory = () => {
  const [orderHistory, setOrderHistory] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
          if (!currentUser) {
            setError('User is not logged in');
            setLoading(false);
            return;
          }

          const token = await currentUser.getIdToken();

          // Fetch user details to get MongoDB userId
          const userDetailsResponse = await axios.get(
            `${import.meta.env.VITE_API}/get-user-id`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const userId = userDetailsResponse.data.user_id;
          if (!userId) {
            setError('Unable to fetch user information.');
            setLoading(false);
            return;
          }

          // Fetch orders for the user
          const orderResponse = await axios.get(
            `${import.meta.env.VITE_API}/user-orders/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setOrderHistory(orderResponse.data.orders);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching order history:', error);
        setError('Failed to fetch order history');
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  const handleToggleRow = (rowId) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  const handleOpenReviewModal = async (product) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API}/product/${product.productId._id}/my-review`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const existingReview = response.data.review;

      setReviewProduct(product);
      setReviewText(existingReview ? existingReview.comment : '');
      setReviewRating(existingReview ? existingReview.rating : 0);
      setReviewModalOpen(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setReviewProduct(product);
        setReviewText('');
        setReviewRating(0);
        setReviewModalOpen(true);
      } else {
        console.error('Error fetching user review:', error);
        Toast('Failed to fetch review. Please try again.', 'error');
      }
    }
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setReviewProduct(null);
    setReviewText('');
    setReviewRating(0);
  };

  const handleSubmitReview = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.post(
        `${import.meta.env.VITE_API}/product/${reviewProduct.productId._id}/review`,
        { rating: reviewRating, comment: reviewText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      handleCloseReviewModal();
      Swal.fire('Success', 'Review submitted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting review:', error);
      Swal.fire('Error', 'Failed to submit review.', 'error');
    }
  };


  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading order history...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 4,
          fontWeight: 'bold',
          textAlign: 'center',
          color: 'white',
        }}
      >
        Order History
      </Typography>
      <Paper sx={{ width: '100%', boxShadow: 3, minHeight: '70vh' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Payment Method</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderHistory.map((order) => (
                <React.Fragment key={order._id}>
                  <TableRow hover>
                    <TableCell>{order._id}</TableCell>
                    <TableCell>
                      {new Date(order.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: order.status === 'shipping' ? 'blue' : 'green',
                        fontWeight: 'bold',
                      }}
                    >
                      {order.status}
                    </TableCell>
                    <TableCell>
                      {order.paymentMethod
                        ? order.paymentMethod.replace('_', ' ').toUpperCase()
                        : 'N/A'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleToggleRow(order._id)}
                        aria-label="expand row"
                      >
                        {expandedRow === order._id ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={5}
                    >
                      <Collapse
                        in={expandedRow === order._id}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ margin: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            Products
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Total</TableCell>
                                {order.status === 'completed' && (
                                  <TableCell>Review</TableCell>
                                )}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {order.products.map((product, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {product.productId?.name || 'Unknown'}
                                  </TableCell>
                                  <TableCell>{product.quantity}</TableCell>
                                  <TableCell>
                                    ₱{product.productId?.price?.toFixed(2) || '0.00'}
                                  </TableCell>
                                  <TableCell>
                                    ₱
                                    {(
                                      (product.productId?.price || 0) *
                                      product.quantity
                                    ).toFixed(2)}
                                  </TableCell>
                                  {order.status === 'completed' && (
                                    <TableCell>
                                      <Button
                                        variant="outlined"
                                        onClick={() =>
                                          handleOpenReviewModal(product)
                                        }
                                      >
                                        Rate & Review
                                      </Button>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                              {/* Subtotal, Taxes, Shipping, and Total */}
                              {(() => {
                                const subtotal = order.products.reduce(
                                  (sum, product) =>
                                    sum +
                                    (product.productId?.price || 0) *
                                      product.quantity,
                                  0
                                );
                                const taxRate = 0.05;
                                const shippingRate = 0.1;
                                const taxes = subtotal * taxRate;
                                const shippingFee = subtotal * shippingRate;
                                const total = subtotal + taxes + shippingFee;

                                return (
                                  <>
                                    <TableRow>
                                      <TableCell
                                        colSpan={3}
                                        align="right"
                                        sx={{ fontWeight: 'bold' }}
                                      >
                                        Subtotal
                                      </TableCell>
                                      <TableCell colSpan={2}>
                                        ₱{subtotal.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell
                                        colSpan={3}
                                        align="right"
                                        sx={{ fontWeight: 'bold' }}
                                      >
                                        Shipping Fee
                                      </TableCell>
                                      <TableCell colSpan={2}>
                                        ₱{shippingFee.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell
                                        colSpan={3}
                                        align="right"
                                        sx={{ fontWeight: 'bold' }}
                                      >
                                        Taxes
                                      </TableCell>
                                      <TableCell colSpan={2}>
                                        ₱{taxes.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell
                                        colSpan={3}
                                        align="right"
                                        sx={{ fontWeight: 'bold' }}
                                      >
                                        Grand Total
                                      </TableCell>
                                      <TableCell
                                        colSpan={2}
                                        sx={{ fontWeight: 'bold' }}
                                      >
                                        ₱{total.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  </>
                                );
                              })()}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Modal open={reviewModalOpen} onClose={handleCloseReviewModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            position: 'relative',
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={handleCloseReviewModal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'gray',
            }}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>

          {/* Modal content */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Review {reviewProduct?.productId?.name || 'Product'}
          </Typography>
          <TextField
            fullWidth
            label="Review"
            multiline
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            sx={{ my: 2 }}
          />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Rating:
          </Typography>
          {/* Rating Component */}
          <Rating
            name="user-rating"
            value={reviewRating}
            onChange={(event, newValue) => {
              setReviewRating(newValue); // Update the rating state when a star is clicked
            }}
            precision={1} // Set rating precision to 1
            max={5} // Maximum 5 stars
            size="large" // Adjust star size
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmitReview}
            sx={{ mt: 2 }}
          >
            Submit Review
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default OrderHistory;