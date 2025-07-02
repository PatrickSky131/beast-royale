package api

import (
	"fmt"
	"math"
	"time"
)

const codeTemplate = "Welcome to Beast Royale!\n\nThis request will not trigger a blockchain transaction or cost any gas fees. It is only used to authorise logging into Beast Royale.\n\nYour authentication status will reset after 12 hours.\n\nWallet address:\nADDRESS\n\nNonce:\nNONCE"

// action labels
const (
	CONNECT_WALLET_LABEL      = "ConnectWallet"
	VERIFY_SIGNATURE_LABEL    = "VerifySignature"
	GET_USER_INFO_LABEL       = "GetUserInfo"
	GET_USER_PROFILE_LABEL    = "GetUserProfile"
	UPDATE_USER_PROFILE_LABEL = "UpdateUserProfile"
	HEALTH_CHECK_LABEL        = "HealthCheck"
)

// param labels
const (
	ADDRESS      = "Address"
	REQUEST_UUID = "RequestUUID"
	Billion      = 1_000_000_000 // 10^9
)

func parseDate(dateStr string) time.Time {
	parsedDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return time.Time{}
	}
	return parsedDate
}

func safeUint64ToInt64(value uint64) (int64, error) {
	if value > math.MaxInt64 {
		return 0, fmt.Errorf("value %d is out of range for int64", value)
	}
	return int64(value), nil
}

func GetCodeTemplate() string {
	return codeTemplate
}
