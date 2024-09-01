import express from 'express';
import { CredentialSignInShopOwner } from '../controllers/ShopOwner/CredentialSignInControllor';

const router = express.Router();

router.post('/signin', CredentialSignInShopOwner);

export default router;
