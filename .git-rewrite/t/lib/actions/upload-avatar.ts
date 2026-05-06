export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (!file) throw new Error('No file selected')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5MB')
  if (!file.type.startsWith('image/')) throw new Error('File must be an image')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('userId', userId)

  const response = await fetch('/api/upload/avatar', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }

  const result = await response.json()
  return result.url
}
