import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Checking Supabase storage schema...");
  try {
    const buckets = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, public FROM storage.buckets;`
    );
    console.log("Existing storage buckets:", buckets);

    const exists = buckets.some((b) => b.id === "member-avatars");
    if (!exists) {
      console.log("Creating 'member-avatars' bucket in storage.buckets...");
      await prisma.$executeRawUnsafe(`
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
          'member-avatars',
          'member-avatars',
          true,
          5242880,
          ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
        )
        ON CONFLICT (id) DO UPDATE SET public = true;
      `);
      console.log("Successfully created 'member-avatars' bucket!");
    } else {
      console.log("'member-avatars' bucket already exists. Ensuring it is public...");
      await prisma.$executeRawUnsafe(`
        UPDATE storage.buckets SET public = true WHERE id = 'member-avatars';
      `);
    }

    // Ensure RLS policy permits public read access to member-avatars
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Member Avatars'
        ) THEN
          CREATE POLICY "Public Access Member Avatars"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'member-avatars');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Upload Member Avatars'
        ) THEN
          CREATE POLICY "Allow Upload Member Avatars"
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = 'member-avatars');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Update Member Avatars'
        ) THEN
          CREATE POLICY "Allow Update Member Avatars"
          ON storage.objects FOR UPDATE
          USING (bucket_id = 'member-avatars');
        END IF;
      END
      $$;
    `);
    console.log("Storage policies for 'member-avatars' configured successfully.");
  } catch (error) {
    console.error("Storage setup error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
