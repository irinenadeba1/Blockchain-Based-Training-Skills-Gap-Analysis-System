;; Skills Analyst Verification Contract
;; This contract validates and manages skills gap analysts

(define-data-var admin principal tx-sender)

;; Data map to store verified analysts
(define-map verified-analysts principal
  {
    name: (string-utf8 100),
    credentials: (string-utf8 500),
    verification-date: uint,
    status: bool
  }
)

;; Public function to verify a new analyst (admin only)
(define-public (verify-analyst (analyst-address principal) (name (string-utf8 100)) (credentials (string-utf8 500)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1)) ;; Only admin can verify
    (ok (map-set verified-analysts analyst-address
      {
        name: name,
        credentials: credentials,
        verification-date: block-height,
        status: true
      }
    ))
  )
)

;; Public function to revoke analyst verification (admin only)
(define-public (revoke-analyst (analyst-address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u2)) ;; Only admin can revoke
    (asserts! (is-some (map-get? verified-analysts analyst-address)) (err u3)) ;; Analyst must exist
    (ok (map-set verified-analysts analyst-address
      (merge (unwrap-panic (map-get? verified-analysts analyst-address)) { status: false })
    ))
  )
)

;; Read-only function to check if an analyst is verified
(define-read-only (is-verified-analyst (analyst-address principal))
  (match (map-get? verified-analysts analyst-address)
    analyst-data (get status analyst-data)
    false
  )
)

;; Read-only function to get analyst details
(define-read-only (get-analyst-details (analyst-address principal))
  (map-get? verified-analysts analyst-address)
)

;; Function to transfer admin rights (admin only)
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u4)) ;; Only current admin can transfer
    (ok (var-set admin new-admin))
  )
)
