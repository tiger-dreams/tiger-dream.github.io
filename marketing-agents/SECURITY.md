# 🔒 Security Guidelines

## ⚠️ CRITICAL: API Key Security

**NEVER commit real API keys to the repository!**

### Exposed Keys - Immediate Action Required

The following keys have been accidentally exposed and need immediate attention:

1. **Gemini API Key**: `your_gemini_api_key`
   - **Action**: Regenerate immediately at https://console.cloud.google.com/apis/credentials
   - **Risk**: High - AI content generation access

2. **Reddit Client Credentials**: 
   - Client ID: `your_reddit_client_id`
   - Client Secret: `your_reddit_client_secret`
   - **Action**: Delete and recreate Reddit app at https://www.reddit.com/prefs/apps
   - **Risk**: Medium - Automated posting access

## 🛡️ Immediate Security Measures

### 1. Regenerate All Exposed Keys

**Gemini API:**
1. Go to Google Cloud Console → APIs & Credentials
2. Find the exposed key and delete it
3. Create a new API key
4. Update your local `.env` file only

**Reddit API:**
1. Go to https://www.reddit.com/prefs/apps
2. Delete "AnnotateShot Marketing Bot" app
3. Create new app with different credentials
4. Run `npm run setup-reddit` again

### 2. Secure Local Environment

```bash
# Copy template without real keys
cp .env.example .env

# Edit .env with your NEW keys (never commit this file)
nano .env
```

### 3. Verify Gitignore

Ensure `.env` is never tracked:
```bash
git rm --cached .env  # Remove if accidentally tracked
git status            # Verify .env not listed
```

## 📋 Security Best Practices

### ✅ Do's
- Use `.env.example` as template with placeholder values
- Keep real API keys in `.env` (local only)
- Use environment variables in production
- Regularly rotate API keys
- Use separate keys for development/production

### ❌ Don'ts
- Never commit `.env` files
- Never hardcode API keys in source code
- Never share API keys in chat/email
- Never use production keys in development

## 🔄 Key Rotation Schedule

- **Monthly**: Rotate all API keys
- **Immediately**: If any key is suspected compromised
- **Before major releases**: Security audit

## 🚨 Incident Response

If keys are accidentally exposed:

1. **Immediately** regenerate/revoke exposed keys
2. Update local `.env` with new keys
3. Check for any unauthorized usage
4. Document the incident
5. Review security practices

## 🔍 Monitoring

Monitor for:
- Unexpected API usage
- Failed authentication attempts  
- Unusual traffic patterns
- Account access from unknown locations

## 📞 Emergency Contacts

If you notice suspicious activity:
- Google Cloud Support: For Gemini API issues
- Reddit Support: For Reddit API abuse
- GitHub Support: For repository security

---

**Remember**: Security is everyone's responsibility! 🛡️