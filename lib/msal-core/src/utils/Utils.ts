// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Account } from "../Account";
import { Library } from "./Constants";

/**
 * @hidden
 */
export class Utils {

  //#region General Util

  /**
   * Utils function to compare two Account objects - used to check if the same user account is logged in
   *
   * @param a1: Account object
   * @param a2: Account object
   */
  static compareAccounts(a1: Account, a2: Account): boolean {
   if (!a1 || !a2) {
          return false;
      }
    if (a1.homeAccountIdentifier && a2.homeAccountIdentifier) {
      if (a1.homeAccountIdentifier === a2.homeAccountIdentifier) {
        return true;
      }
    }
    return false;
  }

  /**
   * Decimal to Hex
   *
   * @param num
   */
  static decimalToHex(num: number): string {
    var hex: string = num.toString(16);
    while (hex.length < 2) {
      hex = "0" + hex;
    }
    return hex;
  }

  /**
   * MSAL JS Library Version
   */
  static getLibraryVersion(): string {
    return Library.version;
  }

  /**
   * Creates a new random GUID - used to populate state?
   * @returns string (GUID)
   */
  static createNewGuid(): string {
    // RFC4122: The version 4 UUID is meant for generating UUIDs from truly-random or
    // pseudo-random numbers.
    // The algorithm is as follows:
    //     Set the two most significant bits (bits 6 and 7) of the
    //        clock_seq_hi_and_reserved to zero and one, respectively.
    //     Set the four most significant bits (bits 12 through 15) of the
    //        time_hi_and_version field to the 4-bit version number from
    //        Section 4.1.3. Version4
    //     Set all the other bits to randomly (or pseudo-randomly) chosen
    //     values.
    // UUID                   = time-low "-" time-mid "-"time-high-and-version "-"clock-seq-reserved and low(2hexOctet)"-" node
    // time-low               = 4hexOctet
    // time-mid               = 2hexOctet
    // time-high-and-version  = 2hexOctet
    // clock-seq-and-reserved = hexOctet:
    // clock-seq-low          = hexOctet
    // node                   = 6hexOctet
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // y could be 1000, 1001, 1010, 1011 since most significant two bits needs to be 10
    // y values are 8, 9, A, B

    const cryptoObj: Crypto = window.crypto; // for IE 11
    if (cryptoObj && cryptoObj.getRandomValues) {
      const buffer: Uint8Array = new Uint8Array(16);
      cryptoObj.getRandomValues(buffer);

      //buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
      buffer[6] |= 0x40; //buffer[6] | 01000000 will set the 6 bit to 1.
      buffer[6] &= 0x4f; //buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".

      //buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
      buffer[8] |= 0x80; //buffer[8] | 10000000 will set the 7 bit to 1.
      buffer[8] &= 0xbf; //buffer[8] & 10111111 will set the 6 bit to 0.

      return Utils.decimalToHex(buffer[0]) + Utils.decimalToHex(buffer[1])
        + Utils.decimalToHex(buffer[2]) + Utils.decimalToHex(buffer[3])
        + "-" + Utils.decimalToHex(buffer[4]) + Utils.decimalToHex(buffer[5])
        + "-" + Utils.decimalToHex(buffer[6]) + Utils.decimalToHex(buffer[7])
        + "-" + Utils.decimalToHex(buffer[8]) + Utils.decimalToHex(buffer[9])
        + "-" + Utils.decimalToHex(buffer[10]) + Utils.decimalToHex(buffer[11])
        + Utils.decimalToHex(buffer[12]) + Utils.decimalToHex(buffer[13])
        + Utils.decimalToHex(buffer[14]) + Utils.decimalToHex(buffer[15]);
    }
    else {
      const guidHolder: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
      const hex: string = "0123456789abcdef";
      let r: number = 0;
      let guidResponse: string = "";
      for (let i: number = 0; i < 36; i++) {
        if (guidHolder[i] !== "-" && guidHolder[i] !== "4") {
          // each x and y needs to be random
          r = Math.random()  * 16 | 0;
        }
        if (guidHolder[i] === "x") {
          guidResponse += hex[r];
        } else if (guidHolder[i] === "y") {
          // clock-seq-and-reserved first hex is filtered and remaining hex values are random
          r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
          r |= 0x8; // set pos 3 to 1 as 1???
          guidResponse += hex[r];
        } else {
          guidResponse += guidHolder[i];
        }
      }
      return guidResponse;
    }
  }

  //#endregion

  //#region Time

  /**
   * Returns time in seconds for expiration based on string value passed in.
   *
   * @param expiresIn
   */
  static parseExpiresIn(expiresIn: string): number {
    // if AAD did not send "expires_in" property, use default expiration of 3599 seconds, for some reason AAD sends 3599 as "expires_in" value instead of 3600
    if (!expiresIn) {
      expiresIn = "3599";
    }
    return parseInt(expiresIn, 10);
  }

  /**
   * return the current time in Unix time. Date.getTime() returns in milliseconds.
   */
  static now(): number {
    return Math.round(new Date().getTime() / 1000.0);
  }

  //#endregion

  //#region Basic Ops

  /**
   * Check if a string is empty
   *
   * @param str
   */
  static isEmpty(str: string): boolean {
    return (typeof str === "undefined" || !str || 0 === str.length);
  }

  /**
   * Converts string array entries to lowercase.
   *
   * @param arr
   */
  static convertArrayEntriesToLowerCase(arr: Array<string>): Array<string> {
    return arr.map(arr => arr.toLowerCase());
  }

  //#endregion

  //#region Encode and Decode

  // See: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_4_%E2%80%93_escaping_the_string_before_encoding_it

  /**
   * encoding string to base64 - platform specific check
   *
   * @param input
   */
  static base64Encode(input: string): string {
    return btoa(encodeURIComponent(input).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(Number("0x" + p1));
    }));
  }

  /**
   * decoding base64 token - platform specific check
   *
   * @param base64IdToken
   */
  static base64Decode(input: string): string {
    return decodeURIComponent(atob(input).split("").map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
  }

  /**
   * deserialize a string
   *
   * @param query
   */
  static deserialize(query: string): any {
    let match: Array<string>; // Regex for replacing addition symbol with a space
    const pl = /\+/g;
    const search = /([^&=]+)=([^&]*)/g;
    const decode = (s: string) => decodeURIComponent(s.replace(pl, " "));
    const obj: {} = {};
    match = search.exec(query);
    while (match) {
      obj[decode(match[1])] = decode(match[2]);
      match = search.exec(query);
    }
    return obj;
  }

  //#endregion

}
