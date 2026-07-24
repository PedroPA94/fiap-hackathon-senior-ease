import { StyleSheet } from "react-native";

import { AppText } from "../../../../components";

export function ProfileBrand() {
  return (
    <AppText
      color="primary"
      variant="titleBold"
      style={styles.brand}
    >
      SeniorEase
    </AppText>
  );
}

const styles = StyleSheet.create({
  brand: {
    textAlign: "center",
  },
});
