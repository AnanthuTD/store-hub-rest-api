import express from 'express';
import { CredentialSignInShopOwner } from '../controllers/ShopOwner/CredentialSignInControllor';
import { signUpShopOwner } from '../controllers/ShopOwner/SignUpController';
import { verifyTokenController } from '../controllers/ShopOwner/VerifyEmailController';
import { resendVerificationTokenController } from '../controllers/ShopOwner/ResendVerificationController';

const router = express.Router();

router.post('/signin', CredentialSignInShopOwner);

router.post('/signup', signUpShopOwner);

router.get('/verify-email', verifyTokenController);

router.get('/resend-token', resendVerificationTokenController);

export default router;
