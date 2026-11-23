/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Calendar, ShieldCheck, Edit, Lock, Unlock, FileCheck, FileBadge } from "lucide-react";
import { useUserDetail } from "../../admin-usecase/useadmin-users-usercase";
import UserTransfer from "./UserTransfer";
import useThemeStore from "@store/theme.store";

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const {
    user,
    isLoading: loading,
    confirmAction,
    setConfirmAction,
    activateDeactivate,
    lockUnlock,
    changeKycStatus,
  } = useUserDetail(id || "");
  const [activeTab, setActiveTab] = useState("personal");

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    if (!status) return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200";
    switch (status.toLowerCase()) {
      case "verified":
      case "approved":
        return "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400";
      case "pending":
        return "bg-secondary-50 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400";
      case "rejected":
        return "bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-md rounded-lg bg-white p-6 text-center shadow-md dark:bg-neutral-900">
          <div className="mb-4 text-5xl text-error-500">!</div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">User Not Found</h2>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">The requested user could not be found.</p>
          <button
            className="rounded-lg bg-primary-500 px-4 py-2 text-white hover:bg-primary-600"
            onClick={() => navigate("/admin/users/all")}
          >
            Back to User List
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full min-w-0 max-w-full overflow-x-hidden px-2 py-3.5 sm:px-4 sm:py-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between" variants={itemVariants}>
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            className="shrink-0 rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:p-2"
            onClick={() => navigate("/admin/users")}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-neutral-900 dark:text-white sm:text-2xl">User Details</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">Manage and view user information</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2.5">
          <motion.button
            className="flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 sm:px-4 sm:text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/admin/users/${id}/edit`)}
          >
            <Edit size={14} className="mr-1.5 shrink-0" />
            Edit User
          </motion.button>
          <motion.button
            className={`flex items-center justify-center rounded-xl px-3 py-2 text-xs font-medium text-white sm:px-4 sm:text-sm ${
              user.isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setConfirmAction({ type: "activate", visible: true })}
          >
            {user.isActive ? (
              <>
                <Lock size={14} className="mr-1.5 shrink-0" />
                Deactivate
              </>
            ) : (
              <>
                <Unlock size={14} className="mr-1.5 shrink-0" />
                Activate
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* User Summary Card */}
      <motion.div
        className="mb-4 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:mb-6 sm:p-5"
        variants={itemVariants}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-neutral-200 dark:border-neutral-700 sm:h-20 sm:w-20">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-200 dark:bg-neutral-700">
                  <User size={28} className="text-neutral-400 dark:text-neutral-500" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="truncate text-base font-semibold text-neutral-900 dark:text-white sm:text-xl">
                {[user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || "N/A"}
              </h2>
              <p className="mb-2.5 break-all text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                {user.email || "N/A"}
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusColor(user.kycStatus)}`}>
                  KYC: {user.kycStatus ? user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1) : "N/A"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    user.isActive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    user.isLocked
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  }`}
                >
                  {user.isLocked ? "Locked" : "Unlocked"}
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {user.accountType ? user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-6">
            <div className="min-w-0 rounded-lg bg-neutral-50 px-2.5 py-2 dark:bg-neutral-900/60">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Account Number</p>
              <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                {user.accountNumber || "N/A"}
              </p>
            </div>
            <div className="min-w-0 rounded-lg bg-neutral-50 px-2.5 py-2 dark:bg-neutral-900/60">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Currency</p>
              <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                {user.currency || "N/A"}
              </p>
            </div>
            <div className="min-w-0 rounded-lg bg-neutral-50 px-2.5 py-2 dark:bg-neutral-900/60">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Last Login</p>
              <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
              </p>
            </div>
            <div className="min-w-0 rounded-lg bg-neutral-50 px-2.5 py-2 dark:bg-neutral-900/60">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">ID Type</p>
              <p className="truncate text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">
                {user.idType ? user.idType.replace("_", " ") : "N/A"}
              </p>
            </div>
            <div className="min-w-0 rounded-lg bg-neutral-50 px-2.5 py-2 dark:bg-neutral-900/60">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">ID Number</p>
              <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                {user.idNumber || "N/A"}
              </p>
            </div>
            <div className="min-w-0 rounded-lg bg-neutral-50 px-2.5 py-2 dark:bg-neutral-900/60">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">ID Expiry</p>
              <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                {user.idExpiryDate ? formatDate(user.idExpiryDate) : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        className="mb-4 flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-700 touch-pan-x scrollbar-hide sm:mb-6"
        variants={itemVariants}
      >
        {[
          { key: "personal", label: "Personal" },
          { key: "account", label: "Account" },
          { key: "financial", label: "Financial" },
          { key: "security", label: "Security" },
          { key: "documents", label: "Documents" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors sm:px-5 sm:py-3 sm:text-sm ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        className="mb-5 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:mb-6 sm:p-5"
        variants={itemVariants}
      >
        {/* Personal Details Tab */}
        {activeTab === "personal" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white sm:mb-4 sm:text-base">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-5 sm:gap-y-4 lg:grid-cols-3">
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Full Name</p>
                <p className="break-words text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                  {[user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || "N/A"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Date of Birth</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                  {user.dateOfBirth ? formatDate(user.dateOfBirth) : "N/A"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Gender</p>
                <p className="text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">{user.gender || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Nationality</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.nationality || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Country of Residence</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.countryOfResidence || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Marital Status</p>
                <p className="text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">{user.maritalStatus || "N/A"}</p>
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Email</p>
                <p className="break-all text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.email || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Mobile Number</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.mobileNumber || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Alternative Phone</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.alternativePhone || "N/A"}</p>
              </div>
            </div>

            <h3 className="mb-3 mt-6 text-sm font-semibold text-neutral-900 dark:text-white sm:mb-4 sm:mt-7 sm:text-base">
              Address Information
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-5 sm:gap-y-4 lg:grid-cols-3">
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Home Address</p>
                <p className="break-words text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.homeAddress || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">City</p>
                <p className="text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">{user.city || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">State/Province</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.stateProvince || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Zip/Postal Code</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.zipCode || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Country</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.country || "N/A"}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Account Details Tab */}
        {activeTab === "account" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white sm:mb-4 sm:text-base">
              Account Information
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-5 sm:gap-y-4 lg:grid-cols-3">
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Account Type</p>
                <p className="text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">{user.accountType || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Account Number</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.accountNumber || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Account Name</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.accountName || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Currency</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.currency || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Initial Deposit</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                  {user.currency}{" "}
                  {typeof user.initialDeposit === "number" ? user.initialDeposit.toLocaleString() : "N/A"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Referral Code</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.referralCode || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Invite Code</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.inviteCode || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Status</p>
                <p className={`text-xs font-medium sm:text-sm ${user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {user.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Last Login</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                  {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Financial Info Tab */}
        {activeTab === "financial" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white sm:mb-4 sm:text-base">
              Financial Information
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-5 sm:gap-y-4 lg:grid-cols-3">
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Source of Income</p>
                <p className="text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">
                  {user.sourceOfIncome ? user.sourceOfIncome.replace("_", " ") : "N/A"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Monthly Income Range</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.monthlyIncomeRange || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Employment Status</p>
                <p className="text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">
                  {user.employmentStatus || "N/A"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Employer Name</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.employerName || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Occupation</p>
                <p className="text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">{user.occupation || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Tax ID</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.taxIdentificationNumber || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">SSN</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.socialSecurityNumber || "N/A"}</p>
              </div>
            </div>

            <h3 className="mb-3 mt-6 text-sm font-semibold text-neutral-900 dark:text-white sm:mb-4 sm:mt-7 sm:text-base">
              Bank Account Information
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-5 sm:gap-y-4 lg:grid-cols-3">
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Bank Name</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.bankName || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Bank Address</p>
                <p className="break-words text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.bankAddress || "N/A"}</p>
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">IBAN Number</p>
                <p className="break-all text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.ibanNumber || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Routing Number</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.routingNumber || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">SWIFT/BIC</p>
                <p className="truncate text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">{user.swiftBic || "N/A"}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Settings Tab */}
        {activeTab === "security" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white sm:mb-4 sm:text-base">
              Security Settings
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-5 sm:gap-y-4 lg:grid-cols-3">
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Two-Factor Auth</p>
                <p className={`text-xs font-medium sm:text-sm ${user.enableTwoFactor ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {user.enableTwoFactor ? "Enabled" : "Disabled"}
                </p>
              </div>
              {user.enableTwoFactor && (
                <div className="min-w-0">
                  <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">2FA Method</p>
                  <p className="text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">
                    {user.twoFactorMethod || "N/A"}
                  </p>
                </div>
              )}
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Account Lock</p>
                <p className={`text-xs font-medium sm:text-sm ${user.isLocked ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {user.isLocked ? "Locked" : "Unlocked"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Login Attempts</p>
                <p className="text-xs font-medium text-neutral-900 dark:text-white sm:text-sm">
                  {user.loginAttempts ? user.loginAttempts.length : "0"}
                </p>
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <p className="mb-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">Security Question</p>
                <p className="break-words text-xs font-medium capitalize text-neutral-900 dark:text-white sm:text-sm">
                  {user.securityQuestion ? user.securityQuestion.replace("_", " ") : "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-700 sm:mt-7 sm:pt-5">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white sm:text-base">Account Actions</h3>
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
                <motion.button
                  className={`flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-medium text-white sm:text-sm ${
                    user.isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setConfirmAction({ type: "activate", visible: true })}
                >
                  {user.isActive ? (
                    <>
                      <Lock size={14} className="mr-1.5" />
                      Deactivate Account
                    </>
                  ) : (
                    <>
                      <Unlock size={14} className="mr-1.5" />
                      Activate Account
                    </>
                  )}
                </motion.button>

                <motion.button
                  className={`flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-medium text-white sm:text-sm ${
                    user.isLocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setConfirmAction({ type: "lock", visible: true })}
                >
                  {user.isLocked ? (
                    <>
                      <Unlock size={14} className="mr-1.5" />
                      Unlock Account
                    </>
                  ) : (
                    <>
                      <Lock size={14} className="mr-1.5" />
                      Lock Account
                    </>
                  )}
                </motion.button>

                <motion.button
                  className="flex items-center justify-center rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 sm:text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/admin/users/${id}/reset-password`)}
                >
                  <Lock size={14} className="mr-1.5" />
                  Reset Password
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white sm:mb-4 sm:text-base">
              User Documents
            </h3>

            <div className="mb-4 grid grid-cols-1 gap-3.5 sm:mb-6 sm:grid-cols-2 sm:gap-5">
              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700 sm:p-4">
                <h4 className="mb-2 text-xs font-medium text-neutral-900 dark:text-white sm:mb-3 sm:text-sm">Government ID</h4>
                <div className="mb-2.5 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
                  {user.governmentId ? (
                    <img src={user.governmentId} alt="Government ID" className="h-full w-full object-contain" />
                  ) : (
                    <FileBadge size={36} className="text-neutral-400 dark:text-neutral-500" />
                  )}
                </div>
                <div className="space-y-1 text-xs text-neutral-900 dark:text-white sm:text-sm">
                  <p>
                    <span className="text-neutral-500 dark:text-neutral-400">ID Type:</span> {user.idType || "N/A"}
                  </p>
                  <p>
                    <span className="text-neutral-500 dark:text-neutral-400">ID Number:</span> {user.idNumber || "N/A"}
                  </p>
                  <p>
                    <span className="text-neutral-500 dark:text-neutral-400">ID Expiry:</span>{" "}
                    {user.idExpiryDate ? formatDate(user.idExpiryDate) : "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700 sm:p-4">
                <h4 className="mb-2 text-xs font-medium text-neutral-900 dark:text-white sm:mb-3 sm:text-sm">Proof of Address</h4>
                <div className="mb-2.5 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
                  {user.proofOfAddress ? (
                    <img src={user.proofOfAddress} alt="Proof of Address" className="h-full w-full object-contain" />
                  ) : (
                    <FileBadge size={36} className="text-neutral-400 dark:text-neutral-500" />
                  )}
                </div>
                <div className="space-y-1 text-xs text-neutral-900 dark:text-white sm:text-sm">
                  <p>
                    <span className="text-neutral-500 dark:text-neutral-400">Document Type:</span>{" "}
                    {user.addressDocType || "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700 sm:p-4">
                <h4 className="mb-2 text-xs font-medium text-neutral-900 dark:text-white sm:mb-3 sm:text-sm">Selfie with ID</h4>
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
                  {user.selfieWithId ? (
                    <img src={user.selfieWithId} alt="Selfie with ID" className="h-full w-full object-contain" />
                  ) : (
                    <User size={36} className="text-neutral-400 dark:text-neutral-500" />
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700 sm:p-4">
                <h4 className="mb-2 text-xs font-medium text-neutral-900 dark:text-white sm:mb-3 sm:text-sm">Signature</h4>
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
                  {user.signature ? (
                    <img src={user.signature} alt="Signature" className="h-full w-full object-contain" />
                  ) : (
                    <FileCheck size={36} className="text-neutral-400 dark:text-neutral-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-700 sm:mt-7 sm:pt-5">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white sm:text-base">
                KYC Status Management
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
                <motion.button
                  className={`flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-medium text-white sm:text-sm ${
                    user.kycStatus === "verified" ? "bg-neutral-400 dark:bg-neutral-600" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={user.kycStatus === "verified"}
                  onClick={() => setConfirmAction({ type: "kyc-verify", visible: true })}
                >
                  <ShieldCheck size={14} className="mr-1.5" />
                  Verify KYC
                </motion.button>

                <motion.button
                  className={`flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-medium text-white sm:text-sm ${
                    user.kycStatus === "pending" ? "bg-neutral-400 dark:bg-neutral-600" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={user.kycStatus === "pending"}
                  onClick={() => setConfirmAction({ type: "kyc-pending", visible: true })}
                >
                  <Calendar size={14} className="mr-1.5" />
                  Mark as Pending
                </motion.button>

                <motion.button
                  className={`flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-medium text-white sm:text-sm ${
                    user.kycStatus === "rejected" ? "bg-neutral-400 dark:bg-neutral-600" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={user.kycStatus === "rejected"}
                  onClick={() => setConfirmAction({ type: "kyc-reject", visible: true })}
                >
                  <Lock size={14} className="mr-1.5" />
                  Reject KYC
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Confirmation Dialog */}
      {confirmAction && confirmAction.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/60">
          <motion.div
            className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg dark:bg-neutral-800 sm:p-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="mb-3 text-base font-semibold text-neutral-900 dark:text-white sm:text-lg">Confirm Action</h3>
            {confirmAction.type === "activate" && (
              <p className="mb-5 text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                Are you sure you want to {user.isActive ? "deactivate" : "activate"} this user account?
                {user.isActive
                  ? " The user will no longer be able to access their account."
                  : " The user will regain access to their account."}
              </p>
            )}
            {confirmAction.type === "lock" && (
              <p className="mb-5 text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                Are you sure you want to {user.isLocked ? "unlock" : "lock"} this user account?
                {user.isLocked
                  ? " The user will be able to log in again."
                  : " The user will be prevented from logging in."}
              </p>
            )}
            {confirmAction.type === "kyc-verify" && (
              <p className="mb-5 text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                Are you sure you want to verify this user's KYC? This will grant them full access to all platform
                features.
              </p>
            )}
            {confirmAction.type === "kyc-pending" && (
              <p className="mb-5 text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                Are you sure you want to mark this user's KYC as pending? This will limit their access to some platform
                features.
              </p>
            )}
            {confirmAction.type === "kyc-reject" && (
              <p className="mb-5 text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                Are you sure you want to reject this user's KYC? This will significantly restrict their account
                functionality.
              </p>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                className="rounded-lg bg-neutral-200 px-3.5 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 sm:text-sm"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 sm:text-sm"
                onClick={() => {
                  if (confirmAction.type === "activate") {
                    activateDeactivate();
                  } else if (confirmAction.type === "lock") {
                    lockUnlock();
                  } else if (confirmAction.type === "kyc-verify") {
                    changeKycStatus("verified");
                  } else if (confirmAction.type === "kyc-pending") {
                    changeKycStatus("pending");
                  } else if (confirmAction.type === "kyc-reject") {
                    changeKycStatus("rejected");
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Render UserTransfer below the details section */}
      <div className="mt-6">
        <UserTransfer />
      </div>
    </motion.div>
  );
};

export default UserDetail;
