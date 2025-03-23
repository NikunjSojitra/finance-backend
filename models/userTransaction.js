  const mongoose = require("mongoose");

const cashFlowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  credit:{
    type:Number,
    trim:true,
    default:0
  },
  debit: {
    type: Number,
    trim: true,
    default:0
  },
  interest:{
    type:Number,
    trim:true,
    default:0
  },
  totalAmount: {
    type: Number,
    trim: true,
    default:0
  },
},{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model("CashFlow", cashFlowSchema);
