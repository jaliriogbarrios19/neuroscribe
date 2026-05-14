use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, KeyInit, OsRng};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use sha2::Sha256;

const SALT: &[u8] = b"neuroscribe_api_key_salt_v1";
const PBKDF2_ITERATIONS: u32 = 100_000;

pub fn derive_key(hardware_id: &str) -> [u8; 32] {
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(
        hardware_id.as_bytes(),
        SALT,
        PBKDF2_ITERATIONS,
        &mut key,
    );
    key
}

pub fn encrypt(plaintext: &str, hardware_id: &str) -> Result<(String, String), String> {
    let derived = derive_key(hardware_id);
    let key = Key::<Aes256Gcm>::from_slice(&derived);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption error: {}", e))?;

    let iv_b64 = BASE64.encode(&nonce_bytes);
    let ct_b64 = BASE64.encode(&ciphertext);

    Ok((iv_b64, ct_b64))
}

pub fn decrypt(iv_b64: &str, ciphertext_b64: &str, hardware_id: &str) -> Result<String, String> {
    let derived = derive_key(hardware_id);
    let key = Key::<Aes256Gcm>::from_slice(&derived);
    let cipher = Aes256Gcm::new(key);

    let iv_bytes = BASE64
        .decode(iv_b64)
        .map_err(|e| format!("IV decode error: {}", e))?;
    let nonce = Nonce::from_slice(&iv_bytes);

    let ct_bytes = BASE64
        .decode(ciphertext_b64)
        .map_err(|e| format!("Ciphertext decode error: {}", e))?;

    let plaintext = cipher
        .decrypt(nonce, ct_bytes.as_ref())
        .map_err(|_| "Decryption failed: las claves fueron cifradas en otro equipo. Debes reingresarlas.".to_string())?;

    String::from_utf8(plaintext).map_err(|e| format!("UTF-8 error: {}", e))
}

pub fn mask_key(key: &str) -> String {
    if key.len() <= 8 {
        return "****".to_string();
    }
    let prefix = &key[..4];
    let suffix = &key[key.len() - 4..];
    format!("{}****{}", prefix, suffix)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let hw_id = "test-hardware-id-12345";
        let api_key = "sk-test-api-key-for-testing-purposes";

        let (iv, ct) = encrypt(api_key, hw_id).unwrap();
        let decrypted = decrypt(&iv, &ct, hw_id).unwrap();

        assert_eq!(api_key, decrypted);
    }

    #[test]
    fn test_different_hardware_fails() {
        let hw_id1 = "hardware-a";
        let hw_id2 = "hardware-b";
        let api_key = "sk-secret-key";

        let (iv, ct) = encrypt(api_key, hw_id1).unwrap();
        let result = decrypt(&iv, &ct, hw_id2);

        assert!(result.is_err());
    }

    #[test]
    fn test_mask_key() {
        assert_eq!(mask_key("sk-1234567890abcdef"), "sk-1****cdef");
        assert_eq!(mask_key("short"), "****");
    }
}
