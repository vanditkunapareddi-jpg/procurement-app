const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const MAX_MEMBERS = 4;

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

const getRoleValue = (role) => {
  if (!role) return "member";
  const lowered = String(role).trim().toLowerCase();
  if (["owner", "admin", "member"].includes(lowered)) return lowered;
  return "member";
};

const requireAuth = (context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Sign in required."
    );
  }
};

const ensureMemberLimit = (memberCount) => {
  if (memberCount >= MAX_MEMBERS) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Member limit reached."
    );
  }
};

const acceptInviteTx = async (tx, accountId, uid, email, inviteRef) => {
  const accountRef = db.doc(`accounts/${accountId}`);
  const memberRef = db.doc(`accounts/${accountId}/members/${uid}`);

  const [accountSnap, memberSnap, inviteSnap] = await Promise.all([
    tx.get(accountRef),
    tx.get(memberRef),
    tx.get(inviteRef),
  ]);

  if (!inviteSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Invite not found.");
  }
  const invite = inviteSnap.data() || {};
  if (invite.status !== "pending") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Invite is no longer active."
    );
  }
  if (!accountSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Account not found."
    );
  }

  const memberCount = Number(accountSnap.get("memberCount") || 0);
  if (!memberSnap.exists) {
    ensureMemberLimit(memberCount);
    tx.set(memberRef, {
      role: getRoleValue(invite.role),
      email,
      joinedAt: FieldValue.serverTimestamp(),
    });
    tx.update(accountRef, {
      memberCount: memberCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  tx.update(inviteRef, {
    status: "accepted",
    acceptedAt: FieldValue.serverTimestamp(),
    acceptedBy: uid,
  });
};

exports.resolveAccountForUser = functions.https.onCall(async (data, context) => {
  requireAuth(context);

  const uid = context.auth.uid;
  const email = normalizeEmail(context.auth.token.email);
  const requestedAccountId =
    typeof data?.accountId === "string" ? data.accountId.trim() : "";
  const defaultAccountId = `acc_${uid}`;

  let targetAccountId = requestedAccountId || defaultAccountId;

  if (requestedAccountId) {
    const memberSnap = await db
      .doc(`accounts/${requestedAccountId}/members/${uid}`)
      .get();
    if (memberSnap.exists) {
      return { accountId: requestedAccountId, reason: "existing" };
    }

    const accountSnap = await db.doc(`accounts/${requestedAccountId}`).get();
    if (accountSnap.exists) {
      const ownerUid = accountSnap.get("ownerUid");
      if (ownerUid && ownerUid !== uid) {
        targetAccountId = defaultAccountId;
      }
    }
  }

  if (email) {
    const inviteQuery = await db
      .collectionGroup("invites")
      .where("email", "==", email)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!inviteQuery.empty) {
      const inviteSnap = inviteQuery.docs[0];
      const inviteRef = inviteSnap.ref;
      const accountId = inviteRef.parent.parent.id;

      await db.runTransaction(async (tx) => {
        await acceptInviteTx(tx, accountId, uid, email, inviteRef);
      });

      return { accountId, acceptedInvite: true };
    }
  }

  const accountRef = db.doc(`accounts/${targetAccountId}`);
  const memberRef = db.doc(`accounts/${targetAccountId}/members/${uid}`);

  await db.runTransaction(async (tx) => {
    const [accountSnap, memberSnap] = await Promise.all([
      tx.get(accountRef),
      tx.get(memberRef),
    ]);

    if (!accountSnap.exists) {
      tx.set(accountRef, {
        name: data?.name || "My Workspace",
        ownerUid: uid,
        createdAt: FieldValue.serverTimestamp(),
        plan: data?.plan || "free",
        memberCount: 1,
      });
    } else if (
      accountSnap.get("ownerUid") &&
      accountSnap.get("ownerUid") !== uid
    ) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Account is not owned by this user."
      );
    } else if (!accountSnap.get("memberCount")) {
      tx.update(accountRef, { memberCount: 1 });
    }

    if (!memberSnap.exists) {
      tx.set(memberRef, {
        role: "owner",
        email,
        joinedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return { accountId: targetAccountId, created: true };
});

exports.inviteMember = functions.https.onCall(async (data, context) => {
  requireAuth(context);

  const uid = context.auth.uid;
  const accountId = String(data?.accountId || "").trim();
  const email = normalizeEmail(data?.email);
  const role = getRoleValue(data?.role);

  if (!accountId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "accountId is required."
    );
  }
  if (!email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invite email is required."
    );
  }

  const accountRef = db.doc(`accounts/${accountId}`);
  const memberRef = db.doc(`accounts/${accountId}/members/${uid}`);
  const inviteRef = db.doc(`accounts/${accountId}/invites/${email}`);

  await db.runTransaction(async (tx) => {
    const [accountSnap, memberSnap] = await Promise.all([
      tx.get(accountRef),
      tx.get(memberRef),
    ]);

    if (!accountSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Account not found.");
    }
    if (!memberSnap.exists) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only members can invite."
      );
    }
    const roleValue = getRoleValue(memberSnap.get("role"));
    if (!["owner", "admin"].includes(roleValue)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only owners or admins can invite."
      );
    }

    const memberCount = Number(accountSnap.get("memberCount") || 0);
    ensureMemberLimit(memberCount);

    tx.set(
      inviteRef,
      {
        email,
        role,
        status: "pending",
        invitedBy: uid,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return { ok: true };
});

exports.revokeInvite = functions.https.onCall(async (data, context) => {
  requireAuth(context);

  const uid = context.auth.uid;
  const accountId = String(data?.accountId || "").trim();
  const email = normalizeEmail(data?.email);

  if (!accountId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "accountId is required."
    );
  }
  if (!email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invite email is required."
    );
  }

  const accountRef = db.doc(`accounts/${accountId}`);
  const memberRef = db.doc(`accounts/${accountId}/members/${uid}`);
  const inviteRef = db.doc(`accounts/${accountId}/invites/${email}`);

  await db.runTransaction(async (tx) => {
    const [accountSnap, memberSnap, inviteSnap] = await Promise.all([
      tx.get(accountRef),
      tx.get(memberRef),
      tx.get(inviteRef),
    ]);

    if (!accountSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Account not found.");
    }
    if (!memberSnap.exists) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only members can revoke invites."
      );
    }
    const roleValue = getRoleValue(memberSnap.get("role"));
    if (!["owner", "admin"].includes(roleValue)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only owners or admins can revoke invites."
      );
    }
    if (!inviteSnap.exists) {
      return;
    }
    tx.delete(inviteRef);
  });

  return { ok: true };
});

exports.updateMemberRole = functions.https.onCall(async (data, context) => {
  requireAuth(context);

  const uid = context.auth.uid;
  const accountId = String(data?.accountId || "").trim();
  const memberUid = String(data?.memberUid || "").trim();
  const role = getRoleValue(data?.role);

  if (!accountId || !memberUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "accountId and memberUid are required."
    );
  }

  const accountRef = db.doc(`accounts/${accountId}`);
  const requesterRef = db.doc(`accounts/${accountId}/members/${uid}`);
  const targetRef = db.doc(`accounts/${accountId}/members/${memberUid}`);

  await db.runTransaction(async (tx) => {
    const [accountSnap, requesterSnap, targetSnap] = await Promise.all([
      tx.get(accountRef),
      tx.get(requesterRef),
      tx.get(targetRef),
    ]);

    if (!accountSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Account not found.");
    }
    if (!requesterSnap.exists || !targetSnap.exists) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Member not found."
      );
    }

    const requesterRole = getRoleValue(requesterSnap.get("role"));
    if (!["owner", "admin"].includes(requesterRole)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only owners or admins can update roles."
      );
    }

    const targetRole = getRoleValue(targetSnap.get("role"));
    if (targetRole === "owner") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Owner role cannot be changed."
      );
    }

    tx.update(targetRef, { role });
  });

  return { ok: true };
});

exports.removeMember = functions.https.onCall(async (data, context) => {
  requireAuth(context);

  const uid = context.auth.uid;
  const accountId = String(data?.accountId || "").trim();
  const memberUid = String(data?.memberUid || "").trim();

  if (!accountId || !memberUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "accountId and memberUid are required."
    );
  }
  if (uid === memberUid) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "You cannot remove yourself."
    );
  }

  const accountRef = db.doc(`accounts/${accountId}`);
  const requesterRef = db.doc(`accounts/${accountId}/members/${uid}`);
  const targetRef = db.doc(`accounts/${accountId}/members/${memberUid}`);

  await db.runTransaction(async (tx) => {
    const [accountSnap, requesterSnap, targetSnap] = await Promise.all([
      tx.get(accountRef),
      tx.get(requesterRef),
      tx.get(targetRef),
    ]);

    if (!accountSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Account not found.");
    }
    if (!requesterSnap.exists || !targetSnap.exists) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Member not found."
      );
    }

    const requesterRole = getRoleValue(requesterSnap.get("role"));
    if (!["owner", "admin"].includes(requesterRole)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only owners or admins can remove members."
      );
    }

    const targetRole = getRoleValue(targetSnap.get("role"));
    if (targetRole === "owner") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Owner cannot be removed."
      );
    }

    const memberCount = Number(accountSnap.get("memberCount") || 0);
    tx.delete(targetRef);
    tx.update(accountRef, {
      memberCount: Math.max(1, memberCount - 1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});

exports.acceptInvite = functions.https.onCall(async (data, context) => {
  requireAuth(context);

  const uid = context.auth.uid;
  const accountId = String(data?.accountId || "").trim();
  const email = normalizeEmail(context.auth.token.email);

  if (!accountId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "accountId is required."
    );
  }
  if (!email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invite email is required."
    );
  }

  const inviteRef = db.doc(`accounts/${accountId}/invites/${email}`);

  await db.runTransaction(async (tx) => {
    await acceptInviteTx(tx, accountId, uid, email, inviteRef);
  });

  return { ok: true };
});
