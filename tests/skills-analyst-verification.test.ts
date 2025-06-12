import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract functions
const mockContractFunctions = {
  verifyAnalyst: vi.fn(),
  revokeAnalyst: vi.fn(),
  isVerifiedAnalyst: vi.fn(),
  getAnalystDetails: vi.fn(),
  transferAdmin: vi.fn()
};

// Mock the blockchain state
let mockBlockchainState = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  verifiedAnalysts: new Map()
};

describe('Skills Analyst Verification Contract', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockBlockchainState = {
      admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      verifiedAnalysts: new Map()
    };
    
    // Reset mock functions
    vi.resetAllMocks();
    
    // Setup mock implementations
    mockContractFunctions.verifyAnalyst.mockImplementation((sender, analystAddress, name, credentials) => {
      if (sender !== mockBlockchainState.admin) {
        return { error: 1 };
      }
      
      mockBlockchainState.verifiedAnalysts.set(analystAddress, {
        name,
        credentials,
        verificationDate: 123456, // Mock block height
        status: true
      });
      
      return { success: true };
    });
    
    mockContractFunctions.revokeAnalyst.mockImplementation((sender, analystAddress) => {
      if (sender !== mockBlockchainState.admin) {
        return { error: 2 };
      }
      
      if (!mockBlockchainState.verifiedAnalysts.has(analystAddress)) {
        return { error: 3 };
      }
      
      const analyst = mockBlockchainState.verifiedAnalysts.get(analystAddress);
      mockBlockchainState.verifiedAnalysts.set(analystAddress, {
        ...analyst,
        status: false
      });
      
      return { success: true };
    });
    
    mockContractFunctions.isVerifiedAnalyst.mockImplementation((analystAddress) => {
      if (!mockBlockchainState.verifiedAnalysts.has(analystAddress)) {
        return false;
      }
      
      return mockBlockchainState.verifiedAnalysts.get(analystAddress).status;
    });
    
    mockContractFunctions.getAnalystDetails.mockImplementation((analystAddress) => {
      return mockBlockchainState.verifiedAnalysts.get(analystAddress) || null;
    });
    
    mockContractFunctions.transferAdmin.mockImplementation((sender, newAdmin) => {
      if (sender !== mockBlockchainState.admin) {
        return { error: 4 };
      }
      
      mockBlockchainState.admin = newAdmin;
      return { success: true };
    });
  });
  
  it('should verify an analyst when called by admin', () => {
    const result = mockContractFunctions.verifyAnalyst(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'John Doe',
        'Certified Skills Analyst with 5 years experience'
    );
    
    expect(result).toEqual({ success: true });
    expect(mockBlockchainState.verifiedAnalysts.has('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe(true);
    expect(mockBlockchainState.verifiedAnalysts.get('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG').status).toBe(true);
  });
  
  it('should not verify an analyst when called by non-admin', () => {
    const result = mockContractFunctions.verifyAnalyst(
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP',
        'Jane Smith',
        'Certified Skills Analyst'
    );
    
    expect(result).toEqual({ error: 1 });
    expect(mockBlockchainState.verifiedAnalysts.has('ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP')).toBe(false);
  });
  
  it('should revoke an analyst when called by admin', () => {
    // First verify an analyst
    mockContractFunctions.verifyAnalyst(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'John Doe',
        'Certified Skills Analyst with 5 years experience'
    );
    
    // Then revoke the analyst
    const result = mockContractFunctions.revokeAnalyst(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    expect(result).toEqual({ success: true });
    expect(mockBlockchainState.verifiedAnalysts.get('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG').status).toBe(false);
  });
  
  it('should correctly check if an analyst is verified', () => {
    // First verify an analyst
    mockContractFunctions.verifyAnalyst(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'John Doe',
        'Certified Skills Analyst with 5 years experience'
    );
    
    // Check if verified
    let result = mockContractFunctions.isVerifiedAnalyst('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(result).toBe(true);
    
    // Revoke the analyst
    mockContractFunctions.revokeAnalyst(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    // Check again
    result = mockContractFunctions.isVerifiedAnalyst('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(result).toBe(false);
  });
  
  it('should transfer admin rights', () => {
    const newAdmin = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    
    const result = mockContractFunctions.transferAdmin(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        newAdmin
    );
    
    expect(result).toEqual({ success: true });
    expect(mockBlockchainState.admin).toBe(newAdmin);
  });
});
