// User Model - Admin and Shop Owners
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: function () {
        return this.role === "shop"
      },
    },
    ownerName: {
      type: String,
      required: function () {
        return this.role === "shop"
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    phone: {
      type: String,
      required: function () {
        return this.role === "shop"
      },
    },
    address: {
      type: String,
      required: function () {
        return this.role === "shop"
      },
    },
    role: {
      type: String,
      enum: ["admin", "shop"],
      default: "shop",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    shopLogo: {
      type: String,
      default: "",
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: "PKR",
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

const User = mongoose.model("User", userSchema)

export default User
