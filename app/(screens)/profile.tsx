import Button from "@/components/Button";
import Header from "@/components/Header";
import InfoTable, { InfoTableDataItem } from "@/components/InfoTable";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { URLS } from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useRouter, Stack } from "expo-router";
import React, { useMemo } from "react";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [auth] = useAuth();
  const [driver] = useDriver();

  // Extract driver information from auth user object (contains full driver data from login)
  const user = auth?.user as any;
  const personalInfo = user?.personal_information || {};
  const contactInfo = user?.contact_information || {};
  const paymentInfo = user?.payment_and_compensation || {};
  const activity = user?.activity || {};

  // Personal Information
  const firstName = personalInfo?.first_name || "";
  const lastName = personalInfo?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Driver";
  const dateOfBirth = personalInfo?.date_of_birth || "N/A";
  const gender = personalInfo?.gender || "N/A";
  const ethnicity = personalInfo?.ethnicity || "N/A";
  const languages = personalInfo?.driver_language || "N/A";
  const ssn = personalInfo?.social_security_number || "N/A";
  const yearsOfExperience = user?.years_of_experience || "N/A";

  // Contact Information
  const email = contactInfo?.primary_email_address || "N/A";
  const phone = contactInfo?.primary_phone_number || "N/A";
  const whatsapp = contactInfo?.whatsapp_contact_number || "N/A";

  // Driver Details
  const driverNumber = user?.driver_number || "N/A";
  const driverRecId = user?.driver_rec_id || user?.id || "N/A";
  const driverNetworkNumber = user?.driver_network_number || "N/A";
  const driverType = user?.driver_type || "N/A";
  const availability = user?.availability || "N/A";
  const grade = user?.grade || "N/A";
  const currentRideStatus = user?.current_ride_status || "N/A";
  const isOnline = user?.is_online === "YES" || user?.is_online === true || driver?.online || false;

  // Activity
  const numberOfRides = activity?.number_of_rides || 0;
  const lastActiveAt = activity?.last_active_at || "N/A";
  const lastSignInAt = activity?.last_sign_in_at || "N/A";

  // Payment Information
  const commissionPercentage = paymentInfo?.commission_percentage || "N/A";
  const hourlyRate = paymentInfo?.hourly_rate || "N/A";
  const distanceRate = paymentInfo?.distance_rate || "N/A";
  const paymentCycle = paymentInfo?.payment_cycle || "N/A";
  const paymentDay = paymentInfo?.payment_day || "N/A";
  const bankName = paymentInfo?.payment_bank_name || "N/A";
  const bankAccountName = paymentInfo?.payment_bank_account_name || "N/A";
  const bankAccountNumber = paymentInfo?.payment_bank_account_number || "N/A";

  // Format dates for display
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "N/A" || dateStr.includes("0000-00-00")) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Personal Information Section
  const personalInfoItems: InfoTableDataItem[] = useMemo(
    () => [
      { label: "Full Name", value: fullName },
      { label: "Date of Birth", value: formatDate(dateOfBirth) },
      { label: "Gender", value: gender },
      { label: "Ethnicity", value: ethnicity },
      { label: "Languages", value: languages },
      { label: "Years of Experience", value: String(yearsOfExperience) },
    ],
    [fullName, dateOfBirth, gender, ethnicity, languages, yearsOfExperience]
  );

  // Contact Information Section
  const contactInfoItems: InfoTableDataItem[] = useMemo(
    () => [
      { label: "Email", value: email },
      { label: "Phone", value: phone },
      { label: "WhatsApp", value: whatsapp },
    ],
    [email, phone, whatsapp]
  );

  // Driver Details Section
  const driverDetailsItems: InfoTableDataItem[] = useMemo(
    () => [
      { label: "Driver Number", value: driverNumber },
      { label: "Driver ID", value: String(driverRecId) },
      { label: "Network Number", value: driverNetworkNumber },
      { label: "Driver Type", value: driverType },
      { label: "Availability", value: availability },
      { label: "Grade", value: grade },
      { label: "Current Status", value: isOnline ? "Online" : "Offline" },
      { label: "Ride Status", value: currentRideStatus },
    ],
    [driverNumber, driverRecId, driverNetworkNumber, driverType, availability, grade, isOnline, currentRideStatus]
  );

  // Activity Section
  const activityItems: InfoTableDataItem[] = useMemo(
    () => [
      { label: "Total Rides", value: String(numberOfRides) },
      { label: "Last Active", value: formatDate(lastActiveAt) },
      { label: "Last Sign In", value: formatDate(lastSignInAt) },
    ],
    [numberOfRides, lastActiveAt, lastSignInAt]
  );

  // Payment Information Section
  const paymentInfoItems: InfoTableDataItem[] = useMemo(
    () => [
      { label: "Commission %", value: commissionPercentage !== "N/A" ? `${commissionPercentage}%` : "N/A" },
      { label: "Hourly Rate", value: hourlyRate !== "N/A" ? `$${hourlyRate}` : "N/A" },
      { label: "Distance Rate", value: distanceRate !== "N/A" ? `$${distanceRate}` : "N/A" },
      { label: "Payment Cycle", value: paymentCycle },
      { label: "Payment Day", value: paymentDay !== "N/A" ? String(paymentDay) : "N/A" },
      { label: "Bank Name", value: bankName },
      { label: "Account Name", value: bankAccountName },
      { label: "Account Number", value: bankAccountNumber !== "N/A" ? `****${String(bankAccountNumber).slice(-4)}` : "N/A" },
    ],
    [commissionPercentage, hourlyRate, distanceRate, paymentCycle, paymentDay, bankName, bankAccountName, bankAccountNumber]
  );

  const handleEditProfile = () => {
    // Open web portal in browser
    const portalUrl = URLS.driverPortal;
    if (portalUrl) {
      Linking.openURL(portalUrl).catch((err) => {
        console.error("Failed to open driver portal:", err);
      });
    }
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/more");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Profile" hideBackIcon={false} onBackPress={handleBackPress} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Logo size="Large" />
        </View>

        {/* Personal Information */}
        <InfoTable
          title="Personal Information"
          data={personalInfoItems}
          showFooter={false}
        />

        {/* Contact Information */}
        <InfoTable
          title="Contact Information"
          data={contactInfoItems}
          showFooter={false}
        />

        {/* Driver Details */}
        <InfoTable
          title="Driver Details"
          data={driverDetailsItems}
          showFooter={false}
        />

        {/* Activity */}
        <InfoTable
          title="Activity"
          data={activityItems}
          showFooter={false}
        />

        {/* Payment Information */}
        <InfoTable
          title="Payment Information"
          data={paymentInfoItems}
          showFooter={false}
        />

        {/* Edit Profile Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            rounded="half"
            onPress={handleEditProfile}
            style={styles.editButton}
          >
            Edit Profile on Web Portal
          </Button>
        </View>

        {/* Info Note */}
        <View style={styles.noteContainer}>
          <Typography
            type="bodySmall"
            weight="regular"
            style={styles.noteText}
          >
            Profile information can only be edited through the web portal. Tap
            the button above to open the portal in your browser.
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  editButton: {
    width: "100%",
  },
  noteContainer: {
    backgroundColor: textColors.grey50,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  noteText: {
    color: textColors.grey700,
    textAlign: "center",
    lineHeight: 20,
  },
});
