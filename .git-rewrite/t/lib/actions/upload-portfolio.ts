export async function uploadPortfolioImage(
  file: File,
  braiderId: string
): Promise<{ id: string; public_url: string }> {
  if (!file) throw new Error('No file selected')
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be under 10MB')
  if (!file.type.startsWith('image/')) throw new Error('File must be an image')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('braiderId', braiderId)

  const response = await fetch('/api/upload/portfolio', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }

  const result = await response.json()
  return result
}
