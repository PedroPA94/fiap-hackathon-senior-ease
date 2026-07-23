import AsyncStorage from "@react-native-async-storage/async-storage";

import { AsyncStorageAdapter } from "./async-storage-adapter";

const mockedAsyncStorage = jest.mocked(AsyncStorage);

describe("AsyncStorageAdapter", () => {
  const adapter = new AsyncStorageAdapter();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates reads to AsyncStorage", async () => {
    mockedAsyncStorage.getItem.mockResolvedValue("stored-value");

    await expect(adapter.getItem("key")).resolves.toBe("stored-value");

    expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith("key");
  });

  it("delegates writes to AsyncStorage", async () => {
    mockedAsyncStorage.setItem.mockResolvedValue();

    await expect(adapter.setItem("key", "value")).resolves.toBeUndefined();

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith("key", "value");
  });

  it("delegates removals to AsyncStorage", async () => {
    mockedAsyncStorage.removeItem.mockResolvedValue();

    await expect(adapter.removeItem("key")).resolves.toBeUndefined();

    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith("key");
  });

  it("preserves errors from AsyncStorage", async () => {
    const error = new Error("native storage failed");
    mockedAsyncStorage.getItem.mockRejectedValue(error);

    await expect(adapter.getItem("key")).rejects.toBe(error);
  });
});
